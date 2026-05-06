import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../utils/api';
import { getPublicBlogPath } from '../../utils/blogLinks';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';

interface RelatedArticle {
  id: number;
  publicId?: string;
  title: string;
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

  // 获取介绍信息
  useEffect(() => {
    if (isOpen && messages.length === 0 && isAuthenticated) {
      api.ai.getIntroduction().then(intro => {
        setMessages([{
          id: Date.now().toString(),
          content: intro,
          isUser: false,
          timestamp: new Date(),
        }]);
      }).catch(err => {
        console.error('获取AI介绍失败:', err);
      });
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

    setMessages(prev => [...prev, userMessage, pendingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 构建对话历史（不包括当前问题，排除介绍消息）
      const history = messages
        .filter((_, index) => index > 0) // 跳过第一条介绍消息
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.content,
        }));

      const requestPayload = {
        question: currentQuestion,
        conversationId: conversationId || undefined,
        history: history.length > 0 ? history : undefined,
      };

      let hasDelta = false;
      await api.ai.chatStream(requestPayload, {
        onStatus: (message) => {
          if (hasDelta) return;
          setMessages(prev => prev.map(msg => (
            msg.id === assistantMessageId ? { ...msg, content: message } : msg
          )));
        },
        onDelta: (text) => {
          if (!text) return;
          setMessages(prev => prev.map(msg => (
            msg.id === assistantMessageId
              ? { ...msg, content: hasDelta ? `${msg.content}${text}` : text }
              : msg
          )));
          hasDelta = true;
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
      });

    } catch (error) {
      console.error('AI流式聊天失败，回退普通接口:', error);
      try {
        const history = messages
          .filter((_, index) => index > 0)
          .map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content,
          }));
        const response: AIChatResponse = await api.ai.chat({
          question: currentQuestion,
          conversationId: conversationId || undefined,
          history: history.length > 0 ? history : undefined,
        });
        const answer = (response.answer || '').trim();
        if (!answer) {
          throw new Error('AI返回内容为空');
        }
        if (!conversationId) {
          setConversationId(response.conversationId);
        }
        setMessages(prev => prev.map(msg => (
          msg.id === assistantMessageId
            ? { ...msg, content: answer, relatedArticles: response.relatedArticles }
            : msg
        )));
      } catch (fallbackError) {
        console.error('AI聊天失败:', fallbackError);
        setMessages(prev => prev.map(msg => (
          msg.id === assistantMessageId
            ? { ...msg, content: '抱歉，我暂时无法回答。请稍后再试。' }
            : msg
        )));
      }
    } finally {
      setIsLoading(false);
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
                          <p className={`text-sm whitespace-pre-wrap font-light ${message.isUser ? 'text-background' : 'text-foreground'
                            }`}>
                            {message.content}
                          </p>

                          {/* 相关文章链接 */}
                          {!message.isUser && message.relatedArticles && message.relatedArticles.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 font-mono-display uppercase tracking-wider">
                                <ExternalLink className="w-3 h-3" />
                                相关文章
                              </p>
                              <div className="space-y-1.5">
                                {message.relatedArticles.map((article) => (
                                  <button
                                    key={article.id}
                                    onClick={() => handleArticleClick(article)}
                                    className="block w-full text-left text-xs text-accent hover:underline truncate transition-colors font-mono-display"
                                  >
                                    {article.title}
                                  </button>
                                ))}
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
                    placeholder={!isAuthenticated ? '请先登录' : '问我任何问题...'}
                    disabled={isLoading || !isAuthenticated}
                    className="flex-1 rounded-sm border-border focus:border-accent focus:ring-accent/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || !isAuthenticated}
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
