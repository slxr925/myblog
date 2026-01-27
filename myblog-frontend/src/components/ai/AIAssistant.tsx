import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

interface RelatedArticle {
  id: number;
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

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 获取介绍信息
  useEffect(() => {
    if (isOpen && messages.length === 0) {
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
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    const currentQuestion = inputValue;
    setMessages(prev => [...prev, userMessage]);
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

      const response: AIChatResponse = await api.ai.chat({
        question: currentQuestion,
        conversationId: conversationId || undefined,
        history: history.length > 0 ? history : undefined,
      });

      if (!conversationId) {
        setConversationId(response.conversationId);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        isUser: false,
        timestamp: new Date(),
        relatedArticles: response.relatedArticles,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI聊天失败:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我暂时无法回答。请稍后再试。',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  const handleArticleClick = (articleId: number) => {
    setIsOpen(false);
    navigate(`/blog/${articleId}`);
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
                                onClick={() => handleArticleClick(article.id)}
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
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border rounded-sm rounded-bl-none px-4 py-2.5">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入框 */}
              <div className="p-4 bg-background border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="问我任何问题..."
                    disabled={isLoading}
                    className="flex-1 rounded-sm border-border focus:border-accent focus:ring-accent/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
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
