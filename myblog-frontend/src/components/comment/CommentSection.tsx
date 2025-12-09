import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Reply, MoreHorizontal, Send, User, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import type { CommentVO, CommentCreateDTO } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CommentSectionProps {
  blogId: number;
  className?: string;
}

interface CommentItemProps {
  comment: CommentVO;
  onReply: (parentId: number, content: string) => void;
  onLike: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  isReply?: boolean;
  user?: any;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onDelete,
  isReply = false,
  user,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
    }
  };

  const handleLike = () => {
    if (!user) {
      alert('请先登录后再点赞评论');
      return;
    }
    if (!isLiking) {
      setIsLiking(true);
      onLike(comment.id);
      setTimeout(() => setIsLiking(false), 1000);
    }
  };

  return (
    <div className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <Card className="mb-4 border-gray-200 shadow-sm">
        <CardContent className="p-4">
          {/* 评论头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                <AvatarFallback className="text-sm">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-gray-800">{comment.userName}</div>
                <div className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createTime), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`text-gray-500 hover:text-red-500 ${isLiking ? 'text-red-500' : ''}`}
                disabled={isLiking}
              >
                <Heart className={`w-4 h-4 mr-1 ${isLiking ? 'fill-current' : ''}`} />
                {comment.likeCount}
              </Button>
              {user?.id === comment.userId && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 评论内容 */}
          <div className="text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* 回复按钮 */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-gray-500 hover:text-blue-500"
            >
              <Reply className="w-4 h-4 mr-1" />
              回复
            </Button>
            {comment.replyCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {comment.replyCount} 条回复
              </Badge>
            )}
          </div>

          {/* 回复输入框 */}
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3"
            >
              <div className="flex space-x-2">
                <Textarea
                  placeholder="写下你的回复..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 min-h-[80px] border-gray-300 focus:border-blue-500"
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="px-3"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyInput(false);
                      setReplyContent('');
                    }}
                    className="px-3"
                  >
                    取消
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 子评论 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  isReply={true}
                  user={user}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ blogId, className = '' }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.comment.getByBlogId(blogId, { page: 1, size: 100 });
      if (response && response.records) {
        setComments(response.records);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error('获取评论失败:', error);
      setError(error.message || '获取评论失败，请稍后重试');
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (blogId) {
      fetchComments();
    }
  }, [blogId]);

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      setError('请输入评论内容');
      return;
    }

    if (!user) {
      setError('请先登录后再发表评论');
      // 触发显示登录模态框
      window.dispatchEvent(new CustomEvent('auth:showLogin'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const commentData: CommentCreateDTO = {
        blogId,
        content: newComment.trim(),
        parentId: 0, // 顶级评论
      };

      await api.comment.create(commentData);
      setNewComment('');
      await fetchComments(); // 重新获取评论列表
    } catch (error: any) {
      console.error('提交评论失败:', error);
      if (error.isAuthError) {
        setError('登录已过期，请重新登录');
        // 触发认证过期事件
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: '登录已过期，请重新登录' }
        }));
      } else {
        setError(error.message || '提交评论失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 回复评论
  const handleReply = async (parentId: number, content: string) => {
    if (!content.trim()) {
      setError('请输入回复内容');
      return;
    }

    if (!user) {
      setError('请先登录后再回复评论');
      window.dispatchEvent(new CustomEvent('auth:showLogin'));
      return;
    }

    try {
      setError(null);
      const commentData: CommentCreateDTO = {
        blogId,
        content,
        parentId,
      };

      await api.comment.create(commentData);
      await fetchComments(); // 重新获取评论列表
    } catch (error: any) {
      console.error('回复评论失败:', error);
      if (error.isAuthError) {
        setError('登录已过期，请重新登录');
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: '登录已过期，请重新登录' }
        }));
      } else {
        setError(error.message || '回复评论失败，请稍后重试');
      }
    }
  };

  // 点赞评论
  const handleLikeComment = async (commentId: number) => {
    if (!user) {
      setError('请先登录后再点赞评论');
      return;
    }

    try {
      await api.comment.toggleLike(commentId);
      // 重新获取评论列表以更新点赞数
      await fetchComments();
    } catch (error: any) {
      console.error('点赞评论失败:', error);
      if (error.isAuthError) {
        setError('登录已过期，请重新登录');
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: '登录已过期，请重新登录' }
        }));
      } else {
        setError(error.message || '点赞失败，请稍后重试');
      }
    }
  };

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    if (window.confirm('确定要删除这条评论吗？')) {
      try {
        await api.comment.delete(commentId);
        await fetchComments(); // 重新获取评论列表
      } catch (error: any) {
        console.error('删除评论失败:', error);
        if (error.isAuthError) {
          setError('登录已过期，请重新登录');
          window.dispatchEvent(new CustomEvent('auth:expired', {
            detail: { message: '登录已过期，请重新登录' }
          }));
        } else {
          setError(error.message || '删除评论失败，请稍后重试');
        }
      }
    }
  };

  return (
    <div className={`mt-12 ${className}`}>
      {/* 评论区标题 */}
      <div className="flex items-center mb-6">
        <MessageCircle className="w-5 h-5 mr-2" />
        <h3 className="text-xl font-semibold text-gray-800">
          评论 ({comments.length})
        </h3>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </Button>
        </div>
      )}

      {/* 发表评论 */}
      <Card className="mb-6 border-gray-200 shadow-sm">
        <CardContent className="p-4">
          {user ? (
            <div className="flex space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
                <AvatarFallback className="text-sm">
                  {(user.nickname || user.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="写下你的评论..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-3 border-gray-300 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? '发送中...' : '发表评论'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">登录后即可发表评论</p>
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('auth:showLogin'))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                立即登录
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评论列表 */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onLike={handleLikeComment}
              onDelete={handleDeleteComment}
              user={user}
            />
          ))}
        </div>
      ) : (
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">还没有评论，来发表第一条评论吧！</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentSection;