import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, User, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { api } from '../../utils/api';
import type { CommentVO } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Message {
  type: 'success' | 'error';
  text: string;
}

// 扩展CommentVO接口，添加blogTitle字段
interface ExtendedCommentVO extends CommentVO {
  blogTitle?: string;
}

export const MyComments: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [comments, setComments] = useState<ExtendedCommentVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // 获取评论列表
  const fetchComments = async (page: number = 1) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.user.getMyComments({ page, size: pageSize });
      if (response && response.records) {
        setComments(response.records);
        setTotal(response.total);
      } else {
        setComments([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error('获取评论失败:', error);
      setMessages([{ type: 'error', text: error.message || '获取评论失败，请稍后重试' }]);
      setComments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchComments(currentPage);
    }
  }, [currentPage, user]);

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    try {
      await api.comment.delete(commentId);
      setMessages([{ type: 'success', text: '评论已删除' }]);
      await fetchComments(currentPage);
    } catch (error: any) {
      console.error('删除评论失败:', error);
      if (error.isAuthError) {
        setMessages([{ type: 'error', text: '登录已过期，请重新登录' }]);
      } else {
        setMessages([{ type: 'error', text: error.message || '删除评论失败，请稍后重试' }]);
      }
    }
  };

  // 跳转到博客详情
  const handleNavigateToBlog = (blogId: number) => {
    window.open(`/blog/${blogId}`, '_blank');
  };

  // 消息自动消失
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        setMessages([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">请先登录查看您的评论</p>
          <Button onClick={openAuthModal} className="bg-blue-600 hover:bg-blue-700">
            立即登录
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-500" />
          我的评论
        </h2>
        <p className="text-muted-foreground mt-1">
          您发表过的博客评论
        </p>
      </div>

      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className={`w-5 h-5 ${
                    message.type === 'success' ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {message.text}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 加载状态 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <Card key={comment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={comment.userAvatar} alt={comment.username} />
                      <AvatarFallback className="text-lg">
                        {comment.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-800">{comment.username}</span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(comment.createTime), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </span>
                      </div>
                      <div className="text-gray-700 mb-3 leading-relaxed">
                        {comment.content}
                      </div>
                      {comment.blogTitle && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            评论于：{comment.blogTitle}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigateToBlog(comment.blogId)}
                            className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                          >
                            查看博客
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">还没有发表任何评论</h3>
              <p className="text-muted-foreground">
                去发现一些有趣的内容并发表评论吧！
              </p>
            </div>
            <Button onClick={() => navigate('/blog')}>
              浏览文章
            </Button>
          </div>
        </Card>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex justify-center pt-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            <span className="text-sm text-gray-600">
              第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(total / pageSize)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComments;