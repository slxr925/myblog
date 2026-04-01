import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Trash2, User, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { api } from '../../utils/api';
import { getPublicBlogPath } from '../../utils/blogLinks';
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
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 6;
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  // 获取评论列表
  const fetchComments = async (page: number = 1) => {
    if (!user) {
      setHasLoaded(true);
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
      setHasLoaded(true);
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
  const handleNavigateToBlog = (comment: ExtendedCommentVO) => {
    window.open(getPublicBlogPath({ publicId: comment.publicId, id: comment.blogId }), '_blank');
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
      <Card className="rounded-none border-border">
        <CardContent className="p-12 text-center">
          <User className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
          <p className="mb-4 text-lg text-muted-foreground">请先登录查看您的评论</p>
          <Button onClick={openAuthModal} className="rounded-none">
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
          <MessageCircle className="w-6 h-6 text-accent" />
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
            <Card className="rounded-none border-border bg-muted/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  <span className="text-foreground">
                    {message.text}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 数据列表 - 加载完成前不显示任何内容 */}
      {!hasLoaded ? null : comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="rounded-none border-border py-0 transition-colors hover:border-accent/40">
              <CardContent className="p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 font-mono-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {formatDistanceToNow(new Date(comment.createTime), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <div className="line-clamp-2 text-xs text-foreground/80">
                      {comment.content}
                    </div>
                    {comment.blogTitle && (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 max-w-[120px] truncate">
                          {comment.blogTitle}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleNavigateToBlog(comment)}
                          className="h-auto p-0 font-mono-display text-[10px] uppercase tracking-[0.16em] text-accent hover:text-foreground"
                        >
                          查看
                          <ExternalLink className="w-2 h-2 ml-0.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteComment(comment.id)}
                    className="h-6 w-6 shrink-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-none border-border p-12">
          <div className="text-center space-y-4">
            <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">还没有发表任何评论</h3>
              <p className="text-muted-foreground">
                去发现一些有趣的内容并发表评论吧！
              </p>
            </div>
            <Button onClick={() => navigate('/blog')} className="rounded-none">
              浏览文章
            </Button>
          </div>
        </Card>
      )}

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex flex-col items-center gap-2 pt-4">
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {currentPage}/{Math.ceil(total / pageSize)}页 共{total}条
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= Math.ceil(total / pageSize) || loading}
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(total / pageSize), prev + 1))}
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
