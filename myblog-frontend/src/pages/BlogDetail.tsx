import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, Heart, MessageCircle, ArrowLeft, Share2, ThumbsUp } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import type { BlogDetailVO } from '../types/api';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { CommentSection } from '../components/comment/CommentSection';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // 为了兼容性，保持blogData变量
  const blogData = blog || {};

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // 先尝试使用普通文章详情API，避免增强版API的问题
        const response = await api.blog.getDetail(Number(id));

        // 直接使用响应数据（已经通过响应拦截器提取了data部分）

        setBlog(response);
        setLikeCount(response.likeCount || 0);
        setIsLiked(response.isLiked || false);

        // 记录博客访问
        api.admin.trackVisit(`/blog/${id}`).catch(err =>
          console.warn('记录博客访问失败:', err)
        );
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
        console.error('错误详情:', err.response?.data || err.message);
        setError(err.response?.data?.message || '获取文章详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
  }, [id]);

  // 点赞处理函数
  const handleLike = async () => {
    if (!user || !blog || isLiking) return;

    try {
      setIsLiking(true);

      // 调用点赞API，获取操作后的状态
      const newIsLiked = await api.blog.toggleLike(blog.id);

      // 重新获取博客详情以更新点赞数量
      const response = await api.blog.getDetail(blog.id);
      setBlog(response);
      setLikeCount(response.likeCount || 0);

      // 使用API返回的状态
      setIsLiked(newIsLiked);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // 分享处理函数
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogData.title,
          text: blogData.summary,
          url: window.location.href,
        });
      } catch (error) {
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      // 这里可以添加一个toast提示
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">文章不存在</h2>
            <p className="text-muted-foreground mb-4">{error || '该文章可能已被删除或不存在'}</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* 导航栏 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Button>
            <h1 className="text-xl font-bold text-foreground">文章详情</h1>
            <div className="w-20"></div> {/* 占位保持对称 */}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 文章头部信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {blogData.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {blogData.authorName && (
                <span className="flex items-center">
                  <span className="font-medium">作者:</span> {blogData.authorName}
                </span>
              )}
              {blogData.categoryName && (
                <span className="flex items-center">
                  <span className="font-medium">分类:</span> {blogData.categoryName}
                </span>
              )}
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.ceil((blogData.content?.length || 0) / 500)}分钟阅读
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {blogData.viewCount || 0}
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {likeCount}
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {blogData.commentCount || 0}
              </span>
            </div>

            {blogData.tags && Array.isArray(blogData.tags) && blogData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="text-sm font-medium text-muted-foreground">标签:</span>
                {blogData.tags.map((tag, index) => (
                  <Badge key={tag.id || index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    {tag.name || (typeof tag === 'string' ? tag : '未知标签')}
                  </Badge>
                ))}
              </div>
            )}

            {blogData.summary && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground/80 leading-relaxed">{blogData.summary}</p>
              </div>
            )}

            {/* 互动按钮区域 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex flex-wrap gap-4 py-4 border-y border-border"
            >
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                disabled={!user || isLiking}
                className={`flex items-center space-x-2 ${
                  isLiked ? "bg-red-500 hover:bg-red-600 text-white" : ""
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${isLiking ? "animate-pulse" : ""}`} />
                <span>{isLiked ? "已点赞" : "点赞"}</span>
                <Badge variant="secondary" className="ml-1">
                  {likeCount}
                </Badge>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>分享</span>
              </Button>

              {!user && (
                <p className="text-sm text-muted-foreground self-center">
                  <a href="/login" className="text-primary hover:underline">
                    登录
                  </a>
                  后可以点赞文章
                </p>
              )}
            </motion.div>
          </motion.div>

          {/* 文章内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            {blogData.content ? (
              <MarkdownRenderer content={blogData.content} />
            ) : (
              <div className="bg-muted/30 p-8 rounded-lg text-center">
                <p className="text-muted-foreground">文章内容正在加载中或暂无内容</p>
              </div>
            )}
          </motion.div>

          {/* 评论区域 */}
          {blog && (
            <CommentSection blogId={blog.id} />
          )}

          {/* 相关推荐 - 暂时移除，因为普通API不包含相关推荐数据 */}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogDetail;