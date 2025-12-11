import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Heart, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { api } from '../utils/api';
import type { BlogDetailVO, LikeResultDTO } from '../types/api';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { CommentSection } from '../components/comment/CommentSection';
import CollectButton from '../components/blog/CollectButton';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const { openAuthModal } = useAuthModal();

  const blogData = blog || {} as BlogDetailVO;

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.blog.getDetail(Number(id));
        setBlog(response);
        setLikeCount(response.likeCount || 0);
        setIsLiked(response.isLiked || false);
        setCommentCount(response.commentCount || 0);

        api.admin.trackVisit(`/blog/${id}`).catch(err =>
          console.warn('记录博客访问失败:', err)
        );
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
      } finally {
        // 确保页面从顶部开始显示
        window.scrollTo(0, 0);
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  // 使用useCallback优化函数，避免每次渲染都创建新函数
  const handleLike = useCallback(async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!blog || isLiking) return;

    try {
      setIsLiking(true);
      const result: LikeResultDTO = await api.blog.toggleLikeWithDetails(blog.id);
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
      if (blog) {
        setBlog({
          ...blog,
          likeCount: result.likeCount,
          viewCount: result.viewCount,
          isLiked: result.isLiked
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  }, [user, blog, isLiking, openAuthModal]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogData.title,
          text: blogData.summary,
          url: window.location.href,
        });
      } catch (error) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [blogData.title, blogData.summary]);

  // 处理评论计数变化
  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <h2 className="text-xl font-bold mb-2">文章不存在</h2>
            <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <div className="bg-muted/30 border-b border-border py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="default">{blogData.categoryName || '未分类'}</Badge>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
              {blogData.title}
            </h1>
            
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                {(blogData.authorName || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground">{blogData.authorName || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil((blogData.content?.length || 0) / 500)} min read</span>
                  <span>·</span>
                  <span>{blogData.viewCount} views</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={isLiked ? "default" : "secondary"}
                className={`rounded-full w-10 h-10 p-0 flex items-center justify-center ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <CollectButton
                blogId={blog.id}
                size="icon"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              />
              <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_250px] gap-12">
        {/* Main Content */}
        <article className="prose prose-lg prose-indigo dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-2xl prose-img:shadow-xl">
          {blogData.coverImg && (
            <img 
              src={blogData.coverImg} 
              alt={blogData.title} 
              className="w-full aspect-video object-cover mb-10 rounded-2xl"
            />
          )}
          
            {blogData.content ? (
              <MarkdownRenderer content={blogData.content} />
            ) : (
            <p className="text-muted-foreground">暂无内容</p>
          )}
        </article>

        {/* Sidebar */}
        <aside className="hidden md:block space-y-8 sticky top-24 h-fit">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold text-foreground mb-4">目录</h3>
            {/* TODO: Implement dynamic TOC based on markdown content */}
            <p className="text-sm text-muted-foreground">目录生成功能开发中...</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
            <h3 className="font-bold text-lg mb-2">订阅更新</h3>
            <p className="text-indigo-100 text-sm mb-4">每周精选技术文章，直接发送到你的邮箱。</p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 border-none">
                订阅
              </Button>
              </div>
          </div>
        </aside>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-4 max-w-4xl pb-20">
        <div className="border-t border-border pt-10">
          <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> 评论 ({commentCount})
          </h3>
            <CommentSection blogId={blog.id} onCommentCountChange={handleCommentCountChange} />
        </div>
      </div>
    </div>
  );
};

// 使用React.memo优化组件，避免不必要的重渲染
export default React.memo(BlogDetail);