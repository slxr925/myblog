import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import BlogCard from './BlogCard';

const EnhancedBlog = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section - Editorial Modernism */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Subtle background texture */}
        <div className="absolute inset-0 texture-grain pattern-editorial-grid opacity-50" />

        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-24 lg:pb-20 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Main headline */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.9 }}
                className="max-w-4xl"
              >
                <h1 className="text-editorial-huge text-foreground mb-5">
                  探索技术边界
                </h1>
                <p className="text-xl lg:text-2xl leading-relaxed text-muted-foreground font-light mb-8">
                  分享代码<span className="text-accent">&</span>思考
                </p>
              </motion.div>

              {/* Description and CTA */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.9 }}
                className="max-w-3xl"
              >
                <p className="text-lg lg:text-xl leading-relaxed text-muted-foreground font-light mb-8">
                  这里是 Ryan 的个人博客。我热衷于分享技术心得与设计思考。希望这些文字能给你带来启发。
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Button
                    onClick={handleScrollToPosts}
                    className="group px-8 py-4 text-sm sm:text-base bg-foreground text-background hover:bg-foreground/90 rounded-sm font-medium tracking-wide transition-all duration-300"
                  >
                    开始阅读
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNavigateToAbout}
                    className="px-8 py-4 text-sm sm:text-base rounded-sm border-2 hover:bg-muted/50 transition-all duration-300"
                  >
                    关于作者
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Articles Grid - Editorial Style */}
      <div id="posts-grid" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 lg:mb-16 gap-4">
          <div>
            <p className="font-mono-display text-xs uppercase tracking-[0.2em] text-accent mb-3">
              Latest Stories
            </p>
            <h2 className="text-editorial-lg text-foreground">
              最新文章
            </h2>
          </div>
          <Button
            variant="ghost"
            onClick={handleNavigateToBlog}
            className="group h-auto px-0 py-3 font-mono-display text-sm sm:text-base uppercase tracking-[0.18em] text-foreground hover:bg-transparent hover:text-accent"
          >
            查看全部
            <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-card border border-border h-[450px] animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
