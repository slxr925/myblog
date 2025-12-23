import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import BlogCard from './BlogCard';

const EnhancedBlog = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 优化数据转换逻辑 - 使用useMemo缓存
  const extractBlogArray = useCallback((payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const recordPayload = payload as Record<string, unknown>;
      return (recordPayload.records || recordPayload.content || recordPayload.data || []) as any[];
    }
    return [];
  }, []);

  const convertBlogsToPosts = useCallback((blogData: any[]): BlogPost[] => {
    return blogData.map((blog: any) => {
      let publishDate = '';
      const publishSource = blog.publishTime ?? blog.date ?? blog.createTime ?? blog.updateTime;
      if (publishSource) {
        try {
          const dateObj = Array.isArray(publishSource)
            ? new Date(publishSource[0], (publishSource[1] ?? 1) - 1, publishSource[2] ?? 1)
            : new Date(publishSource);
          publishDate = dateObj.toLocaleDateString('zh-CN');
        } catch (e) { publishDate = '未知日期'; }
      }

      const tags = Array.isArray(blog.tags)
        ? blog.tags.map((t: any) => (typeof t === 'string' ? t : t.name ?? '')).filter(Boolean)
        : [];

      return {
        id: Number(blog.id) || blog.id,
        title: blog.title || '未命名文章',
        excerpt: blog.summary || blog.excerpt || '',
        content: blog.content || '',
        author: blog.authorName || blog.authorNickname || '未知作者',
        date: publishDate,
        readTime: `${Math.max(1, Math.ceil(((blog.content || '').length) / 500))} min`,
        views: blog.viewCount ?? 0,
        likes: blog.likeCount ?? 0,
        comments: blog.commentCount ?? 0,
        tags,
        image: blog.coverImg || blog.coverImage || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
        featured: blog.isTop === 1,
        categoryId: blog.categoryId,
        categoryName: blog.categoryName,
      };
    });
  }, []);

  // 优化点击处理函数
  const handlePostClick = useCallback((postId: number | string) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  const handleScrollToPosts = useCallback(() => {
    document.getElementById('posts-grid')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  const handleNavigateToAbout = useCallback(() => {
    navigate('/about');
  }, [navigate]);

  const handleNavigateToBlog = useCallback(() => {
    navigate('/blog');
  }, [navigate]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await api.blog.getLatest(6);
        const blogData = extractBlogArray(result);
        setPosts(convertBlogsToPosts(blogData));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [extractBlogArray, convertBlogsToPosts]);

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Hero Section */}
      <div className="relative bg-background border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-background to-purple-50/30 dark:from-indigo-950/30 dark:via-background dark:to-purple-950/20 pointer-events-none" />

        <div className="container mx-auto px-4 pt-12 pb-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4">👋 Welcome to my digital garden</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mt-2 mb-6 tracking-tight leading-tight">
                探索技术边界 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  分享代码与思考
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                这里是 Ryan 的个人博客。我热衷于分享全栈开发、架构设计与 AI 技术落地的心得体会。希望这些文字能给你带来启发。
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 w-full sm:w-auto">
                <Button className="w-full sm:w-auto px-6 py-5 text-base rounded-2xl" onClick={handleScrollToPosts}>
                  开始阅读 <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="secondary" className="w-full sm:w-auto px-6 py-5 text-base rounded-2xl" onClick={handleNavigateToAbout}>
                  关于作者
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div id="posts-grid" className="container mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground">最新文章</h2>
            <p className="text-muted-foreground mt-2">探索最新的深度技术分享</p>
          </div>
          <Button variant="ghost" onClick={handleNavigateToBlog}>查看全部 <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card rounded-3xl h-96 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                index={index}
                onClick={handlePostClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 使用React.memo优化组件，避免不必要的重渲染
export default React.memo(EnhancedBlog);