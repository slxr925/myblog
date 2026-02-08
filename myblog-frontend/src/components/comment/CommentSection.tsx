import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Reply, MoreHorizontal, Send, User, AlertCircle, Smile } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { api } from '../../utils/api';
import type { CommentVO, CommentCreateDTO } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FollowButton from '../user/FollowButton';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface CommentSectionProps {
  blogId: number;
  className?: string;
  onCommentCountChange?: (count: number) => void;
}

interface CommentItemProps {
  comment: CommentVO;
  onReply: (parentId: number, replyUserId: number, content: string) => void;
  onLike: (commentId: number) => void;
  onDelete?: (commentId: number) => void;
  isReply?: boolean;
  user?: any;
  depth?: number;
}

const renderCommentContent = (content: string) => {
  const parts = content.split(/(@[\\w\\-\\u4e00-\\u9fa5]{1,20})/g);
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={index} className="text-accent font-medium">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onReply,
  onLike,
  onDelete,
  isReply = false,
  user,
  depth = 1,
}) => {
  const [isLiking, setIsLiking] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyEmojiPicker, setShowReplyEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTotal = depth === 1 ? (comment.replyCount ?? comment.replies?.length ?? 0) : 0;

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, comment.userId, replyContent.trim());
      setReplyContent('');
      setShowReplyInput(false);
      setShowReplyEmojiPicker(false);
    }
  };

  // 处理表情选择
  const handleReplyEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = replyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = replyContent;

    setReplyContent(
      text.substring(0, start) + emojiData.emoji + text.substring(end)
    );

    // 恢复光标位置
    setTimeout(() => {
      textarea.selectionStart = start + emojiData.emoji.length;
      textarea.selectionEnd = start + emojiData.emoji.length;
      textarea.focus();
    }, 0);

    setShowReplyEmojiPicker(false);
  };

  const handleLike = () => {
    if (!user) {
      alert('请先登录后再点赞评论');
      return;
    }
    if (isLiking) return; // 防止快速重复点击

    setIsLiking(true);
    onLike(comment.id);
    // 300ms 防抖，既能防止并发问题，又不会让用户感觉卡顿
    setTimeout(() => setIsLiking(false), 300);
  };

  const handleReport = async () => {
    if (!user) {
      alert('请先登录后再举报评论');
      return;
    }
    const reason = window.prompt('请输入举报原因（选填）');
    try {
      await api.report.create({
        targetType: 'comment',
        targetId: comment.id,
        reason: reason || '',
        detail: '',
      });
      alert('举报已提交，感谢反馈');
    } catch (error) {
      console.error('举报失败:', error);
      alert('举报失败，请稍后再试');
    }
  };

  // 根据点赞状态决定样式
  const isCommentLiked = comment.isLiked;
  const likeButtonClass = isCommentLiked
    ? 'text-destructive hover:text-destructive/80'
    : 'text-muted-foreground hover:text-destructive';
  const heartIconClass = isCommentLiked ? 'fill-current' : '';

  return (
    <div
      id={`comment-${comment.id}`}
      className={`${isReply ? 'ml-8 border-l-2 border-border pl-4' : ''} scroll-mt-24 transition-colors duration-1000`}
    >
      <Card className="mb-4 border-border shadow-sm">
        <CardContent className="p-4">
          {/* 评论头部 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.userAvatar} alt={comment.nickname || comment.username} />
                <AvatarFallback className="text-sm">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-foreground">{comment.nickname || comment.username}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createTime), {
                    addSuffix: true,
                    locale: zhCN,
                  })}
                </div>
              </div>
              {/* 新增关注按钮 */}
              <FollowButton
                userId={comment.userId}
                username={comment.nickname || comment.username}
                size="sm"
                variant="ghost"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={likeButtonClass}
                disabled={isLiking}
              >
                <Heart className={`w-4 h-4 mr-1 ${heartIconClass}`} />
                {comment.likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReport}
                className="text-muted-foreground hover:text-amber-600"
              >
                <AlertCircle className="w-4 h-4" />
              </Button>
              {user?.id === comment.userId && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(comment.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 评论内容 */}
          <div className="text-foreground mb-3 leading-relaxed whitespace-pre-wrap">
            {comment.replyUserNickname && (
              <span className="mr-2 text-muted-foreground">
                回复 <span className="text-accent font-medium">@{comment.replyUserNickname}</span>
              </span>
            )}
            {renderCommentContent(comment.content)}
          </div>

          {/* 回复按钮 */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-muted-foreground hover:text-accent"
            >
              <Reply className="w-4 h-4 mr-1" />
              回复
            </Button>
            {depth === 1 && replyTotal > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-muted-foreground hover:text-accent"
              >
                {isExpanded ? '收起回复' : `展开 ${replyTotal} 条回复`}
              </Button>
            )}
          </div>

          {/* 回复输入框 */}
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3"
            >
              <div className="relative">
                <Textarea
                  ref={replyTextareaRef}
                  placeholder="写下你的回复..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="flex-1 min-h-[80px] border-border focus:border-accent mb-2"
                />

                {/* 工具栏 */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyEmojiPicker(!showReplyEmojiPicker)}
                    className="text-muted-foreground hover:text-accent"
                  >
                    <Smile className="w-4 h-4 mr-1" />
                    表情
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleReply}
                      disabled={!replyContent.trim()}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      发送
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowReplyInput(false);
                        setReplyContent('');
                        setShowReplyEmojiPicker(false);
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>

                {/* 表情选择器 */}
                {showReplyEmojiPicker && (
                  <div className="absolute z-50 mt-2 left-0">
                    <EmojiPicker
                      onEmojiClick={handleReplyEmojiClick}
                      width={350}
                      height={400}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 子评论 */}
          {depth === 1 && isExpanded && comment.replies && comment.replies.length > 0 && (
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
                  depth={2}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export const CommentSection: React.FC<CommentSectionProps> = ({ blogId, className = '', onCommentCountChange }) => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const countAllComments = (items: CommentVO[]): number =>
    items.reduce((total, item) => total + 1 + countAllComments(item.replies || []), 0);

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.comment.getByBlogId(blogId, { page: 1, size: 100 });
      if (response && response.records) {
        setComments(response.records);
        // 通知父组件更新评论计数
        onCommentCountChange?.(countAllComments(response.records));
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

  // 监听登录成功事件，登录后重新获取评论列表
  useEffect(() => {
    const handleLoginSuccess = () => {
      fetchComments();
    };

    window.addEventListener('auth:loginSuccess', handleLoginSuccess);
    return () => {
      window.removeEventListener('auth:loginSuccess', handleLoginSuccess);
    };
  }, [blogId]);

  // 监听评论加载完成，处理锚点滚动
  useEffect(() => {
    if (!loading && comments.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#comment-')) {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // 添加高亮效果
            element.classList.add('bg-accent/10');
            setTimeout(() => {
              element.classList.remove('bg-accent/10');
            }, 2000);
          }
        }, 500);
      }
    }
  }, [loading, comments]);

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      setError('请输入评论内容');
      return;
    }

    if (!user) {
      setError('请先登录后再发表评论');
      // 触发显示登录模态框
      openAuthModal();
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

  // 处理表情选择
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = commentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newComment;

    setNewComment(
      text.substring(0, start) + emojiData.emoji + text.substring(end)
    );

    // 恢复光标位置
    setTimeout(() => {
      textarea.selectionStart = start + emojiData.emoji.length;
      textarea.selectionEnd = start + emojiData.emoji.length;
      textarea.focus();
    }, 0);

    setShowEmojiPicker(false);
  };

  // 回复评论
  const handleReply = async (parentId: number, replyUserId: number, content: string) => {
    if (!content.trim()) {
      setError('请输入回复内容');
      return;
    }

    if (!user) {
      setError('请先登录后再回复评论');
      openAuthModal();
      return;
    }

    try {
      setError(null);
      const commentData: CommentCreateDTO = {
        blogId,
        content,
        parentId,
        replyUserId,
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

  // 点赞评论 - 使用乐观更新避免骨架屏闪现
  const handleLikeComment = async (commentId: number) => {
    if (!user) {
      setError('请先登录后再点赞评论');
      return;
    }

    try {
      // 乐观更新：先更新UI，提升用户体验
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              likeCount: (comment.likeCount || 0) + (comment.isLiked ? -1 : 1),
              isLiked: !comment.isLiked
            };
          }
          // 同时检查是否是子评论
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId
                  ? {
                    ...reply,
                    likeCount: (reply.likeCount || 0) + (reply.isLiked ? -1 : 1),
                    isLiked: !reply.isLiked
                  }
                  : reply
              )
            };
          }
          return comment;
        })
      );

      // 后台调用API
      await api.comment.toggleLike(commentId);
    } catch (error: any) {
      console.error('点赞评论失败:', error);
      // 如果失败，恢复原状态
      await fetchComments();

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
      <Card className="mb-6 border-border shadow-sm">
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
                <div className="relative">
                  <Textarea
                    ref={commentTextareaRef}
                    placeholder="写下你的评论..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2 border-border focus:border-accent"
                    rows={3}
                  />

                  {/* 工具栏 */}
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-muted-foreground hover:text-accent"
                    >
                      <Smile className="w-4 h-4 mr-1" />
                      表情
                    </Button>

                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      className="bg-foreground text-background hover:bg-foreground/90 rounded-sm font-mono-display text-xs uppercase tracking-wider"
                    >
                      {submitting ? '发送中...' : '发表评论'}
                    </Button>
                  </div>

                  {/* 表情选择器 */}
                  {showEmojiPicker && (
                    <div className="absolute z-50 mt-2 left-0">
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={350}
                        height={400}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">登录后即可发表评论</p>
              <Button
                onClick={openAuthModal}
                className="bg-foreground text-background hover:bg-foreground/90 rounded-sm font-mono-display text-xs uppercase tracking-wider"
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
            <Card key={i} className="border-border shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-16 bg-muted rounded"></div>
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
              depth={1}
            />
          ))}
        </div>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">还没有评论，来发表第一条评论吧！</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommentSection;
