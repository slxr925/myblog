import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ExternalLink, CalendarDays, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../utils/api';
import { getPublicBlogPath } from '../../utils/blogLinks';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { markdownConfig } from '../../config/markdown';
import { AiQuotaStatus, useAiQuota } from '../../contexts/AiQuotaContext';

interface RelatedArticleTag {
  id?: number;
  name: string;
  color?: string;
}

interface RelatedArticle {
  id: number;
  publicId?: string;
  title: string;
  categoryId?: number;
  categoryName?: string;
  tags?: RelatedArticleTag[];
  publishTime?: string;
  snippet?: string;
  score?: number;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  relatedArticles?: RelatedArticle[];
}

interface AIChatResponse {
  answer: string;
  conversationId: string;
  aiEnabled: boolean;
  responseTime: number;
  relatedArticles?: RelatedArticle[];
}

interface PersistedMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  relatedArticles?: RelatedArticle[];
}

interface AssistantMemoryState {
  userKey: string;
  isOpen: boolean;
  conversationId: string;
  messages: PersistedMessage[];
}

const AI_ASSISTANT_MAX_PERSISTED_MESSAGES = 60;
const LEGACY_AI_ASSISTANT_STORAGE_KEY = 'myblog:ai-assistant:state:v1';
let assistantMemoryState: AssistantMemoryState | null = null;

const formatArticleDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('zh-CN');
  }
  return value.length >= 10 ? value.slice(0, 10) : value;
};

const getTagName = (tag: RelatedArticleTag | string) => {
  return typeof tag === 'string' ? tag : tag.name;
};

const CompactMarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const { remarkPlugins = [], rehypePlugins = [] } = markdownConfig;

  return (
    <div className="text-sm font-light leading-relaxed text-foreground break-words">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          p: ({ children, ...props }) => (
            <p className="mb-2 last:mb-0 whitespace-normal" {...props}>
              {children}
            </p>
          ),
          h1: ({ children, ...props }) => (
            <h1 className="mt-3 mb-1.5 text-base font-semibold leading-snug text-foreground first:mt-0" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="mt-3 mb-1.5 text-[15px] font-semibold leading-snug text-foreground first:mt-0" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="mt-3 mb-1.5 text-sm font-semibold leading-snug text-foreground first:mt-0" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="mt-2.5 mb-1 text-sm font-medium leading-snug text-foreground first:mt-0" {...props}>
              {children}
            </h4>
          ),
          ul: ({ children, ...props }) => (
            <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="pl-0.5 leading-relaxed" {...props}>
              {children}
            </li>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-semibold text-foreground" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic" {...props}>
              {children}
            </em>
          ),
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className="font-mono text-[12px]" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-sm bg-background/80 px-1 py-0.5 font-mono text-[12px] text-foreground" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className="my-2 max-w-full overflow-x-auto rounded-sm border border-border/70 bg-background/80 p-2" {...props}>
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="my-2 border-l-2 border-accent/70 pl-3 text-muted-foreground" {...props}>
              {children}
            </blockquote>
          ),
          hr: (props) => (
            <hr className="my-3 border-border/70" {...props} />
          ),
          a: ({ children, ...props }) => (
            <a className="text-accent underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="my-2 max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th className="border border-border bg-background px-2 py-1 text-left font-semibold" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="border border-border px-2 py-1 align-top" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [isSessionReady, setIsSessionReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const { quota, runAiAction } = useAiQuota();
  const userKey = isAuthenticated && user ? String(user.id ?? user.username) : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    sessionStorage.removeItem(LEGACY_AI_ASSISTANT_STORAGE_KEY);
  }, []);

  // 路由切换会重建组件，这里只从当前 JS 运行期内存恢复；刷新/关闭/重新登录都会清空
  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!userKey) {
      assistantMemoryState = null;
      setIsOpen(false);
      setMessages([]);
      setConversationId('');
      setInputValue('');
      setIsLoading(false);
      setIsSessionReady(true);
      return;
    }

    const state = assistantMemoryState?.userKey === userKey ? assistantMemoryState : null;
    if (!state) {
      setMessages([]);
      setConversationId('');
      setInputValue('');
      setIsLoading(false);
      setIsSessionReady(true);
      return;
    }

    setIsOpen(state.isOpen);
    setConversationId(state.conversationId);
    setMessages(
      state.messages
        .filter((msg) => msg && typeof msg.id === 'string' && typeof msg.content === 'string')
        .map((msg) => ({
          id: msg.id,
          content: msg.content,
          isUser: !!msg.isUser,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          relatedArticles: msg.relatedArticles,
        })),
    );
    setIsSessionReady(true);
  }, [isAuthLoading, userKey]);

  useEffect(() => {
    if (!isSessionReady || !userKey) {
      if (!userKey) {
        assistantMemoryState = null;
      }
      return;
    }
    const persistedMessages: PersistedMessage[] = messages
      .slice(-AI_ASSISTANT_MAX_PERSISTED_MESSAGES)
      .map((msg) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.isUser,
        timestamp: msg.timestamp.toISOString(),
        relatedArticles: msg.relatedArticles,
      }));

    assistantMemoryState = {
      userKey,
      isOpen,
      conversationId,
      messages: persistedMessages,
    };
  }, [isOpen, conversationId, messages, isSessionReady, userKey]);

  // 获取介绍信息或恢复服务端会话
  useEffect(() => {
    if (isOpen && messages.length === 0 && isAuthenticated) {
      let cancelled = false;
      const loadInitialConversation = async () => {
        try {
          const page = await api.ai.getConversations({ page: 1, size: 1 });
          const latest = page.records?.[0];
          if (latest?.conversationId) {
            const detail = await api.ai.getConversation(latest.conversationId);
            if (!cancelled && detail.messages && detail.messages.length > 0) {
              setConversationId(detail.conversationId);
              setMessages(detail.messages.map((msg) => ({
                id: String(msg.id),
                content: msg.content,
                isUser: msg.role === 'user',
                timestamp: msg.createTime ? new Date(msg.createTime) : new Date(),
              })));
              return;
            }
          }
          const intro = await api.ai.getIntroduction();
          if (!cancelled) {
            setMessages([{
              id: Date.now().toString(),
              content: intro,
              isUser: false,
              timestamp: new Date(),
            }]);
          }
        } catch (err) {
          console.error('初始化AI会话失败:', err);
        }
      };
      loadInitialConversation();
      return () => {
        cancelled = true;
      };
    }
  }, [isOpen, isAuthenticated]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const assistantMessageId = (Date.now() + 1).toString();
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    const currentQuestion = inputValue;
    const pendingMessage: Message = {
      id: assistantMessageId,
      content: `正在理解问题：“${currentQuestion}”...`,
      isUser: false,
      timestamp: new Date(),
    };

    let requestStarted = false;
    try {
      const completed = await runAiAction(async (requestId) => {
        requestStarted = true;
        setMessages(prev => [...prev, userMessage, pendingMessage]);
        setInputValue('');
        setIsLoading(true);

        const history = messages
          .filter((_, index) => index > 0)
          .map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content,
          }));
        const requestPayload = {
          question: currentQuestion,
          conversationId: conversationId || undefined,
          history: history.length > 0 ? history : undefined,
        };

        let streamedAnswer = '';
        await api.ai.chatStream(requestPayload, {
          onStatus: (message) => {
            if (streamedAnswer) return;
            setMessages(prev => prev.map(msg => (
              msg.id === assistantMessageId ? { ...msg, content: message } : msg
            )));
          },
          onDelta: (text) => {
            if (!text) return;
            streamedAnswer += text;
            setMessages(prev => prev.map(msg => (
              msg.id === assistantMessageId ? { ...msg, content: streamedAnswer } : msg
            )));
          },
          onRelatedArticles: (items) => {
            setMessages(prev => prev.map(msg => (
              msg.id === assistantMessageId ? { ...msg, relatedArticles: items } : msg
            )));
          },
          onDone: (data) => {
            if (!conversationId && data?.conversationId) {
              setConversationId(data.conversationId);
            }
          },
        }, requestId);
        return true;
      });
      if (requestStarted && !completed) {
        setMessages(prev => prev.map(msg => (
          msg.id === assistantMessageId
            ? { ...msg, content: 'AI 服务暂时不可用，本次未计入额度。' }
            : msg
        )));
      }
    } catch (error) {
      console.error('AI流式聊天失败:', error);
      setMessages(prev => prev.map(msg => (
        msg.id === assistantMessageId
          ? { ...msg, content: 'AI 服务暂时不可用，本次未计入额度。' }
          : msg
      )));
    } finally {
      if (requestStarted) setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleArticleClick = (article: RelatedArticle) => {
    setIsOpen(false);
    navigate(getPublicBlogPath(article));
  };

  return (
    <>
      {/* 悬浮球按钮 */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* 脉冲动画环 - Editorial风格 */}
        {!isOpen && (
          <>
            <motion.div
              className="absolute inset-0 rounded-sm bg-accent/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-sm bg-accent/10"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-sm bg-foreground text-background hover:bg-foreground/90 shadow-lg border-2 border-border"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Sparkles className="w-6 h-6 text-accent" />
              <motion.span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          )}
        </Button>
      </motion.div>

      {/* 聊天窗口 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-background border border-border rounded-sm shadow-2xl overflow-hidden">
              {/* 头部 - Editorial风格 */}
              <div className="bg-foreground text-background px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-mono-display text-sm uppercase tracking-wider">AI 助手</h3>
                      <p className="text-xs text-background/70">为您解答博客相关问题</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-card">
                {/* 未登录提示 */}
                {!isAuthenticated ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-12 h-12 bg-muted flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground font-medium mb-1">
                      您未登录，请登录后使用AI问答助手
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      登录后即可与AI助手对话
                    </p>
                    <Button
                      onClick={openAuthModal}
                      className="rounded-sm bg-foreground text-background hover:bg-foreground/90 font-mono-display uppercase tracking-wider text-xs px-6"
                    >
                      去登录
                    </Button>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-sm px-4 py-2.5 ${message.isUser
                            ? 'bg-foreground text-background rounded-br-none'
                            : 'bg-muted border border-border rounded-bl-none'
                            }`}
                        >
                          {message.isUser ? (
                            <p className="text-sm whitespace-pre-wrap font-light text-background break-words">
                              {message.content}
                            </p>
                          ) : (
                            <CompactMarkdownMessage content={message.content} />
                          )}

                          {/* 相关文章链接 */}
                          {!message.isUser && message.relatedArticles && message.relatedArticles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-mono-display uppercase tracking-wider">
                                <ExternalLink className="w-3 h-3" />
                                相关文章
                              </p>
                              <div className="space-y-1.5">
                                {message.relatedArticles.map((article) => {
                                  const visibleTags = (article.tags || [])
                                    .map(getTagName)
                                    .filter(Boolean)
                                    .slice(0, 3);
                                  const publishDate = formatArticleDate(article.publishTime);

                                  return (
                                  <button
                                    key={article.id}
                                    onClick={() => handleArticleClick(article)}
                                    className="block w-full text-left rounded-sm border border-border/60 bg-background/60 px-2.5 py-2 transition-colors hover:border-accent/70 hover:bg-background"
                                  >
                                    <span className="block text-xs font-medium text-foreground break-words leading-snug">
                                      {article.title}
                                    </span>
                                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                      <span className="max-w-full truncate border border-border/70 px-1.5 py-0.5 text-[10px] text-foreground">
                                        {article.categoryName || '未分类'}
                                      </span>
                                      {publishDate && (
                                        <span className="inline-flex items-center gap-1">
                                          <CalendarDays className="h-3 w-3 shrink-0" />
                                          {publishDate}
                                        </span>
                                      )}
                                    </span>
                                    {visibleTags.length > 0 && (
                                      <span className="mt-1.5 flex flex-wrap gap-1">
                                        {visibleTags.map((tagName) => (
                                          <span
                                            key={tagName}
                                            className="inline-flex max-w-full items-center gap-1 truncate bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                          >
                                            <Tag className="h-2.5 w-2.5 shrink-0" />
                                            <span className="truncate">{tagName}</span>
                                          </span>
                                        ))}
                                      </span>
                                    )}
                                  </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <p className={`text-xs mt-1 font-mono-display uppercase tracking-wider ${message.isUser ? 'text-background/60' : 'text-muted-foreground'
                            }`}>
                            {message.timestamp.toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* 输入框 */}
              <div className="p-4 bg-background border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={!isAuthenticated ? '请先登录' : quota?.available === false ? '今日额度已用完' : '问我任何问题...'}
                    disabled={isLoading || !isAuthenticated || quota?.available === false}
                    className="flex-1 rounded-sm border-border focus:border-accent focus:ring-accent/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || !isAuthenticated || quota?.available === false}
                    size="icon"
                    className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <AiQuotaStatus className="mt-2 block text-center" />
                <p className="text-xs text-muted-foreground mt-2 text-center font-mono-display uppercase tracking-wider">
                  AI助手可能会出错，请谨慎参考
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
