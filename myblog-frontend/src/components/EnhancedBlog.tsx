import React, { useEffect, useState, useRef } from 'react';
import { Menu, Home, User, Mail, Github, Twitter, Linkedin, Clock, Eye, Heart, MessageCircle, Search, Tag, ArrowRight, LogIn } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { UserMenu } from './auth/UserMenu';
import { AnimatedLights } from './effects/AnimatedLights';
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

// Blog Post Card Component
const BlogPostCard: React.FC<{
  post: BlogPost;
  onLike: (postId: number) => void;
  isLiked: boolean;
  onClick: (postId: number) => void;
}> = ({ post, onLike, isLiked, onClick }) => {
  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike(post.id);
  };

  return (
    <Card
      className="bg-white border-gray-200 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={() => onClick(post.id)}
    >
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-600 font-semibold">{post.categoryName || '未分类'}</span>
          <span className="text-xs text-gray-500">{post.date}</span>
        </div>
        <CardTitle className="text-gray-800 hover:text-blue-600 transition-colors">{post.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 mb-4">{post.excerpt}</CardDescription>

        <div className="flex flex-wrap gap-1 mb-4">
          {post.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {post.views}
            </span>
            <button
              onClick={handleLikeClick}
              className={`flex items-center transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
            >
              <Heart className={`w-4 h-4 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {post.likes + (isLiked ? 1 : 0)}
            </button>
            <span className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.comments}
            </span>
          </div>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 获取博客数据
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('开始获取博客数据...');

        // 直接调用基础API，不使用转换函数
        const response = await api.blog.getLatest(4);
        console.log('原始API响应:', response);
        console.log('response.data:', response.data);

        // 确保数据结构正确 - 真实的博客数据在response.data.data中
        const blogData = response.data.data;
        console.log('提取的博客数据:', blogData);

        if (!blogData || !Array.isArray(blogData)) {
          console.error('数据格式不正确，期望数组，实际得到:', typeof blogData, blogData);
          throw new Error('API返回的数据格式不正确');
        }

        console.log(`成功获取到 ${blogData.length} 篇博客文章`);

        // 手动转换数据
        const transformedPosts = blogData.map((blog: any) => {
          console.log('转换单个博客:', blog);

          // 处理日期格式
          let publishDate = '';
          try {
            if (blog.publishTime) {
              let dateObj: Date;
              if (Array.isArray(blog.publishTime)) {
                const [year, month, day, hour, minute, second] = blog.publishTime;
                dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
              } else {
                dateObj = new Date(blog.publishTime);
              }
              publishDate = dateObj.toLocaleDateString('zh-CN');
            }
          } catch (error) {
            console.error('日期转换错误:', error);
            publishDate = '未知日期';
          }

          // 处理标签
          const tags = blog.tags ? blog.tags.map((tag: any) => {
            if (typeof tag === 'string') {
              return tag;
            } else if (tag && typeof tag === 'object' && 'name' in tag) {
              return tag.name;
            }
            return '';
          }).filter((tag: string) => tag) : [];

          const transformedPost = {
            id: blog.id,
            title: blog.title,
            excerpt: blog.summary || '',
            content: blog.content || '',
            author: blog.authorName || '未知作者',
            date: publishDate,
            readTime: `${Math.ceil((blog.content?.length || 0) / 500)}分钟`,
            views: blog.viewCount || 0,
            likes: blog.likeCount || 0,
            comments: blog.commentCount || 0,
            tags: tags,
            image: blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
            featured: blog.isTop === 1,
            categoryId: blog.categoryId,
            categoryName: blog.categoryName,
          };

          console.log('转换后的文章:', transformedPost);
          return transformedPost;
        });

        console.log('最终转换的文章数据:', transformedPosts);
        setPosts(transformedPosts);
        setFilteredPosts(transformedPosts);

      } catch (error) {
        console.error('获取博客数据失败:', error);

        // 如果API失败，使用模拟数据
        const fallbackPosts = [
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

        console.log('使用备用模拟数据:', fallbackPosts);
        setPosts(fallbackPosts);
        setFilteredPosts(fallbackPosts);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 过滤博客
  useEffect(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(post => post.tags.includes(selectedTag));
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedTag, posts]);

  // 获取所有标签
  const allTags = Array.from(new Set(posts.flatMap(post => post.tags)));

  const handleLike = async (postId: number) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await api.blog.toggleLike(postId);
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (newSet.has(postId)) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // 更新本地文章数据
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
                ...post,
                likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1
              }
            : post
        )
      );
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handlePostClick = (postId: number) => {
    navigate(`/blog/${postId}`);
  };

  const featuredPost = posts.find(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen w-full relative bg-white">
      {/* Dynamic Light Effects */}
      <AnimatedLights />

      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl max-w-7xl mx-auto shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold text-gray-800">{authorName}'s Blog</h1>

            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                首页
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100" onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                {isAuthenticated ? '个人资料' : '关于'}
              </Button>
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                <Mail className="w-4 h-4 mr-2" />
                联系
              </Button>
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  登录
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              className="md:hidden text-gray-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 px-6 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-800 mb-6 leading-tight">
              Welcome.
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {authorBio}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                onClick={() => navigate('/blog')}
              >
                开始阅读
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg"
                onClick={() => navigate('/profile')}
              >
                了解更多
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="relative z-40 px-6 py-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm max-w-4xl mx-auto border border-blue-100">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <Badge className="bg-blue-100 text-blue-800 font-semibold">
                  ⭐ 精选文章
                </Badge>
                <span className="text-sm text-gray-600">{featuredPost.date}</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => handlePostClick(featuredPost.id)}>
                {featuredPost.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{featuredPost.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {featuredPost.readTime}
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {featuredPost.views}
                  </span>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-700 font-semibold group" onClick={() => handlePostClick(featuredPost.id)}>
                  阅读更多
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search and Filter */}
      <section className="relative z-40 px-6 py-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="搜索文章..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
                className={selectedTag === null ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
              >
                全部
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className={`flex items-center ${selectedTag === tag ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section id="blog-posts" className="relative z-40 px-6 py-12 max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">最新文章</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-96 bg-white/10 animate-pulse rounded-xl" />
            ))
          ) : (
            regularPosts.map((post) => (
              <BlogPostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                isLiked={likedPosts.has(post.id)}
                onClick={handlePostClick}
              />
            ))
          )}
        </div>

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">没有找到匹配的文章</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-40 px-6 py-12 mt-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h4 className="text-xl font-bold text-gray-800 mb-2">保持联系</h4>
                <p className="text-gray-600">关注我的社交媒体获取最新动态</p>
              </div>

              <div className="flex gap-4">
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200">
                  <Github className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200">
                  <Twitter className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200">
                  <Linkedin className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-200">
                  <Mail className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
              © 2025 {authorName}的博客. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default EnhancedBlog;