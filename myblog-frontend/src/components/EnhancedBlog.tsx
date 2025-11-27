import React, { useEffect, useState, useRef } from 'react';
import { Github, Twitter, Linkedin, Clock, Eye, Heart, MessageCircle, Search, Tag, ArrowRight, Mail, User, LogIn, Menu, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { AnimatedLights } from './effects/AnimatedLights';
import Navigation from './layout/Navigation';
import CategoryNavigation from './navigation/CategoryNavigation';
import { useNavigate } from 'react-router-dom';

// Glass Effect Component
interface GlassEffectProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
}

const GlassEffect = React.forwardRef<HTMLDivElement, GlassEffectProps>(
  ({ className = "", width = "w-full", height = "h-[40px]", children, ...props }, ref) => {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl ${width} ${height}`}
        ref={ref}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden border border-[#f5f5f51a] rounded-2xl">
          <div className="glass-effect h-full w-full" />
        </div>
        <div className="relative z-20 h-full w-full">
          {children}
        </div>
        <svg style={{ display: 'none' }}>
          <defs>
            <filter id="fractal-noise-glass">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.12 0.12"
                numOctaves="1"
                result="warp"
              />
              <feDisplacementMap
                xChannelSelector="R"
                yChannelSelector="G"
                scale="30"
                in="SourceGraphic"
                in2="warp"
              />
            </filter>
          </defs>
        </svg>
      </div>
    );
  }
);
GlassEffect.displayName = "GlassEffect";

// Liquid Background Component
const LiquidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      time += 0.005;

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsl(${230 + Math.sin(time) * 20}, 70%, 20%)`);
      gradient.addColorStop(0.5, `hsl(${260 + Math.cos(time) * 20}, 60%, 15%)`);
      gradient.addColorStop(1, `hsl(${280 + Math.sin(time * 0.8) * 20}, 65%, 18%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 -z-10" />;
};

// Floating Orbs Component
const FloatingOrbs: React.FC = () => {
  return (
    <>
      <div className="absolute w-[300px] h-[300px] rounded-full overflow-hidden opacity-30 animate-float-1">
        <div className="absolute inset-[5%] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 blur-3xl" />
        <div className="absolute -inset-1/4 backdrop-blur-3xl backdrop-contrast-[200%]" />
      </div>

      <div className="absolute w-[250px] h-[250px] rounded-full overflow-hidden opacity-25 animate-float-2">
        <div className="absolute inset-[5%] rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 blur-3xl" />
        <div className="absolute -inset-1/4 backdrop-blur-3xl backdrop-contrast-[200%]" />
      </div>

      <div className="absolute w-[200px] h-[200px] rounded-full overflow-hidden opacity-20 animate-float-3">
        <div className="absolute inset-[5%] rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 blur-3xl" />
        <div className="absolute -inset-1/4 backdrop-blur-3xl backdrop-contrast-[200%]" />
      </div>

      <style jsx>{`
        @keyframes float-1 {
          0%, 100% { top: 10%; left: 10%; }
          25% { top: 20%; left: 80%; }
          50% { top: 70%; left: 70%; }
          75% { top: 60%; left: 20%; }
        }

        @keyframes float-2 {
          0%, 100% { top: 60%; left: 70%; }
          25% { top: 10%; left: 60%; }
          50% { top: 30%; left: 20%; }
          75% { top: 80%; left: 40%; }
        }

        @keyframes float-3 {
          0%, 100% { top: 40%; left: 40%; }
          25% { top: 70%; left: 10%; }
          50% { top: 20%; left: 80%; }
          75% { top: 50%; left: 60%; }
        }

        .animate-float-1 {
          animation: float-1 20s ease-in-out infinite;
        }

        .animate-float-2 {
          animation: float-2 25s ease-in-out infinite;
        }

        .animate-float-3 {
          animation: float-3 30s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

// 获取分类样式的辅助函数
const getCategoryStyle = (categoryName: string) => {
  const styles = {
    '技术分享': {
      border: 'border-blue-200',
      headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      titleColor: 'text-blue-800',
      badgeColor: 'bg-blue-100 text-blue-700',
      hoverBorder: 'hover:border-blue-300',
      hoverShadow: 'hover:shadow-blue-100'
    },
    '项目实战': {
      border: 'border-green-200',
      headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      titleColor: 'text-green-800',
      badgeColor: 'bg-green-100 text-green-700',
      hoverBorder: 'hover:border-green-300',
      hoverShadow: 'hover:shadow-green-100'
    },
    '生活随笔': {
      border: 'border-purple-200',
      headerBg: 'bg-gradient-to-r from-purple-50 to-pink-50',
      titleColor: 'text-purple-800',
      badgeColor: 'bg-purple-100 text-purple-700',
      hoverBorder: 'hover:border-purple-300',
      hoverShadow: 'hover:shadow-purple-100'
    },
    '学习笔记': {
      border: 'border-orange-200',
      headerBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
      titleColor: 'text-orange-800',
      badgeColor: 'bg-orange-100 text-orange-700',
      hoverBorder: 'hover:border-orange-300',
      hoverShadow: 'hover:shadow-orange-100'
    }
  };

  return styles[categoryName as keyof typeof styles] || styles['技术分享'];
};

// Blog Post Card Component
const BlogPostCard: React.FC<{
  post: BlogPost;
  onClick: (postId: number) => void;
  isLarge?: boolean;
  isAuthenticated: boolean;
  likedPosts: Set<number>;
  onLike: (postId: number, e: React.MouseEvent) => void;
}> = ({ post, onClick, isLarge = false, isAuthenticated, likedPosts, onLike }) => {
  const categoryStyle = getCategoryStyle(post.categoryName || '技术分享');

  if (isLarge) {
    return (
      <Card
        className={`bg-card ${categoryStyle.border} ${categoryStyle.hoverBorder} ${categoryStyle.hoverShadow} transition-all duration-300 hover:scale-[1.03] cursor-pointer overflow-hidden h-full`}
        onClick={() => onClick(post.id)}
      >
        {/* 大卡片头部渐变背景 */}
        <div className={`${categoryStyle.headerBg} p-6 border-b ${categoryStyle.border}`}>
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${categoryStyle.badgeColor} font-semibold text-sm px-3 py-1`}>
              {post.categoryName || '未分类'}
            </Badge>
            <span className="text-sm text-muted-foreground">{post.date}</span>
          </div>
          <CardTitle className={`${categoryStyle.titleColor} hover:text-opacity-80 transition-colors text-2xl font-bold mb-3 line-clamp-2`}>
            {post.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </CardDescription>
        </div>

        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-sm border-border text-muted-foreground hover:border-primary transition-colors duration-300">
                {tag}
              </Badge>
            ))}
          </div>

          {/* 大卡片专属：文章内容预览 */}
          {post.content && (
            <div className="mt-6 mb-6 p-4 bg-muted/30 rounded-lg border border-border transition-colors duration-300">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                <span className="w-1 h-4 bg-primary mr-2"></span>
                文章内容预览
              </h4>
              <div className="prose prose-sm max-w-none text-muted-foreground line-clamp-6">
                {post.content.length > 300 ?
                  `${post.content.substring(0, 300)}...` :
                  post.content
                }
              </div>
              <div className="mt-3 text-right">
                <span className="text-xs text-primary hover:text-primary/80 cursor-pointer font-medium transition-colors duration-300">
                  点击阅读全文 →
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {post.views}
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {post.likes}
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {post.comments}
              </span>
            </div>
            <span className="flex items-center bg-muted px-3 py-1 rounded-full transition-colors duration-300">
              <Clock className="w-4 h-4 mr-1" />
              {post.readTime}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-card ${categoryStyle.border} ${categoryStyle.hoverBorder} ${categoryStyle.hoverShadow} transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden`}
      onClick={() => onClick(post.id)}
    >
      {/* 卡片头部渐变背景 */}
      <div className={`${categoryStyle.headerBg} p-4 border-b ${categoryStyle.border}`}>
        <div className="flex items-center justify-between mb-2">
          <Badge className={`${categoryStyle.badgeColor} font-semibold text-xs`}>
            {post.categoryName || '未分类'}
          </Badge>
          <span className="text-xs text-muted-foreground">{post.date}</span>
        </div>
        <CardTitle className={`${categoryStyle.titleColor} hover:text-opacity-80 transition-colors line-clamp-2`}>
          {post.title}
        </CardTitle>
      </div>

      <CardContent className="p-4">
        <CardDescription className="text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</CardDescription>

        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs border-border text-muted-foreground hover:border-primary transition-colors duration-300">
              {tag}
            </Badge>
          ))}
          {post.tags.length > 3 && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground transition-colors duration-300">
              +{post.tags.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {post.views}
            </span>
            <span className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {post.likes}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              {post.comments}
            </span>
          </div>
          <span className="flex items-center bg-muted px-2 py-1 rounded transition-colors duration-300">
            <Clock className="w-3 h-3 mr-1" />
            {post.readTime}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Enhanced Blog Component
interface EnhancedBlogProps {
  authorName?: string;
  authorBio?: string;
  //authorAvatar?: string;
}

const EnhancedBlog: React.FC<EnhancedBlogProps> = ({
  authorName = "Ryan",
  authorBio = "Java开发工程师，AI应用开发转型中，一起努力成长。",
  //authorAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [searchMode, setSearchMode] = useState<'all' | 'search' | 'tag' | 'category'>('all');

  const extractBlogArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      const recordPayload = payload as Record<string, unknown>;
      if (Array.isArray(recordPayload.records)) {
        return recordPayload.records as any[];
      }
      if (Array.isArray(recordPayload.content)) {
        return recordPayload.content as any[];
      }
      if (Array.isArray(recordPayload.data)) {
        return recordPayload.data as any[];
      }
    }
    return [];
  };

  const convertBlogsToPosts = (blogData: any[]): BlogPost[] => {
    return blogData.map((blog: any) => {
      let publishDate = '';
      const publishSource = blog.publishTime ?? blog.date ?? blog.createTime ?? blog.updateTime;
      if (publishSource) {
        try {
          let dateObj: Date;
          if (Array.isArray(publishSource)) {
            const [year, month, day, hour, minute, second] = publishSource;
            dateObj = new Date(year, (month ?? 1) - 1, day ?? 1, hour || 0, minute || 0, second || 0);
          } else {
            dateObj = new Date(publishSource);
          }
          publishDate = dateObj.toLocaleDateString('zh-CN');
        } catch (error) {
          publishDate = '未知日期';
        }
      }

      const tags = Array.isArray(blog.tags)
        ? blog.tags
            .map((tag: any) => {
              if (typeof tag === 'string') {
                return tag;
              }
              if (tag && typeof tag === 'object' && 'name' in tag) {
                return (tag as { name?: string }).name ?? '';
              }
              return '';
            })
            .filter(Boolean)
        : [];

      const content = blog.content || '';
      const summary = blog.summary || blog.excerpt || blog.description || '';
      const textForReadTime = content || summary;

      return {
        id: Number(blog.id) || blog.id,
        title: blog.title || '未命名文章',
        excerpt: summary,
        content,
        author: blog.authorName || blog.authorNickname || blog.author || '未知作者',
        date: publishDate,
        readTime: `${Math.max(1, Math.ceil((textForReadTime?.length || 0) / 500))}分钟`,
        views: blog.viewCount ?? blog.views ?? 0,
        likes: blog.likeCount ?? blog.likes ?? 0,
        comments: blog.commentCount ?? blog.comments ?? 0,
        tags,
        image: blog.coverImg || blog.coverImage || blog.image || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
        featured: blog.isTop === 1 || blog.isTop === true,
        categoryId: blog.categoryId,
        categoryName: blog.categoryName,
      };
    });
  };

  const fetchPostsByKeyword = async (term: string): Promise<BlogPost[]> => {
    try {
      const result = await api.search.searchBlogs(term, 10);
      return convertBlogsToPosts(extractBlogArray(result));
    } catch (error) {
      console.warn('搜索服务不可用，使用数据库结果:', error);
      const fallback = await api.blog.getBlogList({ keyword: term, size: 10 });
      return fallback.posts;
    }
  };

  // 处理搜索
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setSearchMode('search');
      setSelectedTag(null);
      setSelectedCategory(null);
    } else {
      setSearchMode('all');
    }
  };

  // 处理标签选择
  const handleTagSelect = (tagName: string | null) => {
    setSearchTerm('');
    setSelectedCategory(null);
    if (tagName) {
      setSelectedTag(tagName);
      setSearchMode('tag');
    } else {
      setSelectedTag(null);
      setSearchMode('all');
    }
  };

  // 处理分类选择
  const handleCategorySelect = (categoryId: number | null) => {
    setSearchTerm('');
    setSelectedTag(null);
    if (categoryId) {
      setSelectedCategory(categoryId);
      setSearchMode('category');
    } else {
      setSelectedCategory(null);
      setSearchMode('all');
    }
  };

  // 获取博客数据
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let nextPosts: BlogPost[] = [];

        if (searchMode === 'search' && searchTerm.trim()) {
          nextPosts = await fetchPostsByKeyword(searchTerm.trim());
        } else if (searchMode === 'tag' && selectedTag) {
          const result = await api.blog.searchByTag(selectedTag, 12);
          nextPosts = convertBlogsToPosts(result);
        } else if (searchMode === 'category' && selectedCategory) {
          const result = await api.blog.getByCategoryPublic(selectedCategory, 12);
          nextPosts = convertBlogsToPosts(result);
        } else {
          const result = await api.blog.getLatest(6);
          nextPosts = convertBlogsToPosts(extractBlogArray(result));
        }

        setPosts(nextPosts);
        setFilteredPosts(nextPosts);
      } catch (error) {
        console.error('获取文章失败，使用默认内容:', error);
        const fallbackPosts: BlogPost[] = [
          {
            id: 1,
            title: "Spring Boot 3.x 新特性详解",
            excerpt: "Spring Boot 3.x 版本带来了很多令人兴奋的新特性，本文将详细介绍这些新特性的使用方法和最佳实践。",
            content: "",
            author: "Ryan",
            date: "2025/9/21",
            readTime: "5分钟",
            views: 179,
            likes: 24,
            comments: 5,
            tags: ["Java", "Spring Boot", "后端"],
            image: "https://picsum.photos/seed/blog1/800/400.jpg",
            featured: true,
            categoryName: "技术分享"
          },
          {
            id: 2,
            title: "Docker 容器化部署实践",
            excerpt: "详细介绍如何使用 Docker 容器化部署 Spring Boot 应用，包括 Dockerfile 编写和容器编排。",
            content: "",
            author: "Ryan",
            date: "2025/10/2",
            readTime: "8分钟",
            views: 15,
            likes: 3,
            comments: 1,
            tags: ["Docker", "微服务", "后端"],
            image: "https://picsum.photos/seed/blog2/800/400.jpg",
            featured: false,
            categoryName: "项目实战"
          },
          {
            id: 3,
            title: "Redis 缓存设计与优化",
            excerpt: "分享 Redis 在项目中的缓存设计模式和性能优化技巧，包括缓存穿透、雪崩等问题的解决方案。",
            content: "",
            author: "Ryan",
            date: "2025/10/2",
            readTime: "6分钟",
            views: 8,
            likes: 2,
            comments: 0,
            tags: ["Redis", "微服务", "后端"],
            image: "https://picsum.photos/seed/blog3/800/400.jpg",
            featured: false,
            categoryName: "技术分享"
          }
        ];
        setPosts(fallbackPosts);
        setFilteredPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchMode, searchTerm, selectedTag, selectedCategory]);

  // 设置显示的博客文章（直接使用posts，因为过滤在服务端完成）
  useEffect(() => {
    setFilteredPosts(posts);
  }, [posts]);

  // 获取所有标签
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const handleLike = async (postId: number) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }

    const wasLiked = likedPosts.has(postId);

    try {
      const result = await api.blog.toggleLikeWithDetails(postId);
      const nextLiked = result?.isLiked ?? !wasLiked;
      const nextLikeCountDelta = result?.likeCount;
      const nextViewCount = result?.viewCount;

      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (nextLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id !== postId) {
            return post;
          }
          const fallbackLikes = wasLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
          return {
            ...post,
            likes: nextLikeCountDelta ?? fallbackLikes,
            views: nextViewCount ?? post.views
          };
        })
      );
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
  };

  return (
    <div className="min-h-screen w-full relative bg-background transition-colors duration-300">
      {/* Dynamic Light Effects */}
      <AnimatedLights />

      <Navigation
        title={`${authorName}'s Blog`}
        heroTitle="Welcome."
        heroSubtitle={authorBio}
        heroButtons={
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => navigate('/blog')}
            >
              开始阅读
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-accent px-8 py-3 text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => navigate('/profile')}
            >
              了解更多
            </Button>
          </div>
        }
      />

      
      {/* Search and Filter - Moved to Navigation bar */}

      {/* Blog Posts Grid */}
      <section id="blog-posts" className="relative z-40 px-6 py-12 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-foreground mb-4">
            最新文章
          </h3>
          <p className="text-muted-foreground text-lg">
            探索最新的技术分享、项目实战和学习心得
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 左侧分类导航 */}
          <div className="lg:w-80 flex-shrink-0">
            <CategoryNavigation
              onCategorySelect={handleCategorySelect}
              onTagSelect={handleTagSelect}
              selectedCategory={selectedCategory}
              selectedTag={selectedTag}
            />
          </div>

          {/* 右侧文章列表 */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 bg-white/10 animate-pulse rounded-xl" />
                ))
              ) : (
                filteredPosts.map((post, index) => (
                  <div
                    key={post.id}
                    className="w-full"
                  >
                    <BlogPostCard
                      post={post}
                      onClick={handlePostClick}
                      isLarge={false}
                      isAuthenticated={isAuthenticated}
                      likedPosts={likedPosts}
                      onLike={handleLike}
                    />
                  </div>
                ))
              )}
            </div>

            {!loading && filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">没有找到匹配的文章</p>
              </div>
            )}

            {/* 查看更多按钮 */}
            {!loading && filteredPosts.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10 px-8 py-3 transition-colors duration-300"
                  onClick={() => navigate('/blog')}
                >
                  查看更多文章
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 px-6 py-12 mt-20 bg-muted/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h4 className="text-xl font-bold text-foreground mb-2 transition-colors duration-300">保持联系</h4>
                <p className="text-muted-foreground transition-colors duration-300">关注我的社交媒体获取最新动态</p>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent transition-colors duration-300">
                  <Github className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent transition-colors duration-300">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent transition-colors duration-300">
                  <Linkedin className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent transition-colors duration-300">
                  <Mail className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border text-center text-muted-foreground text-sm transition-colors duration-300">
              © 2025 {authorName}的博客. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
    </div>
  );
};

export default EnhancedBlog;