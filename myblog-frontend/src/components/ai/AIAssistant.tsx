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
        {/* 脉冲动画环 */}
        {!isOpen && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
          </>
        )}
        <Button
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 shadow-2xl shadow-indigo-500/50 border-2 border-white/30 dark:border-slate-800/50"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <div className="relative">
              <Sparkles className="w-6 h-6 text-white" />
              <motion.span
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"
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
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* 头部 */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">AI助手</h3>
                      <p className="text-white/70 text-xs">为您解答博客相关问题</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 消息列表 */}
              <div className="h-96 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${message.isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-background border border-border rounded-bl-sm shadow-sm'
                        }`}
                    >
                      <p className={`text-sm whitespace-pre-wrap ${message.isUser ? 'text-white' : 'text-foreground'
                        }`}>
                        {message.content}
                      </p>

                      {/* 相关文章链接 */}
                      {!message.isUser && message.relatedArticles && message.relatedArticles.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            相关文章
                          </p>
                          <div className="space-y-1.5">
                            {message.relatedArticles.map((article) => (
                              <button
                                key={article.id}
                                onClick={() => handleArticleClick(article.id)}
                                className="block w-full text-left text-xs text-indigo-600 hover:text-indigo-700 hover:underline truncate transition-colors"
                              >
                                📄 {article.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className={`text-xs mt-1 ${message.isUser ? 'text-white/60' : 'text-muted-foreground'
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
                    <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
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
                    className="flex-1 rounded-xl border-border focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
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
