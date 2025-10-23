import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../utils/api';
import Navigation from '../components/layout/Navigation';
import { AuthModal } from '../components/auth/AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  image: string;
  featured: boolean;
  categoryId: number;
  categoryName: string;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  // 获取分类样式
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

  // 获取全部文章
  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setLoading(true);
        const response = await api.blog.getLatest(50);

        // 处理响应数据 - 响应拦截器已经提取了data部分
        const blogData = Array.isArray(response) ? response : [];

        const formattedPosts = blogData.map((blog: any) => {
          // 处理日期格式
          let publishDate = '';
          if (blog.publishTime) {
            try {
              let dateObj: Date;
              if (Array.isArray(blog.publishTime)) {
                const [year, month, day, hour, minute, second] = blog.publishTime;
                dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
              } else {
                dateObj = new Date(blog.publishTime);
              }
              publishDate = dateObj.toLocaleDateString('zh-CN');
            } catch (error) {
              publishDate = '未知日期';
            }
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

          return {
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
        });

        setPosts(formattedPosts);
      } catch (error) {
        console.error('获取文章失败:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []);

  // 过滤文章
  const filteredPosts = selectedCategory
    ? posts.filter(post => post.categoryName === selectedCategory)
    : posts;

  // 获取所有分类
  const allCategories = Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean);

  const handleLike = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止触发文章点击

    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await api.blog.toggleLike(postId);

      // 先获取当前点赞状态
      const wasLiked = likedPosts.has(postId);

      // 更新点赞状态
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (wasLiked) {
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
                likes: wasLiked ? post.likes - 1 : post.likes + 1
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">正在加载文章...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation
        title="Ryan's Blog"
        showHero={true}
        heroTitle="全部文章"
        heroSubtitle="探索所有技术分享、项目实战和学习心得"
        heroButtons={null}
        isAuthModalOpen={isAuthModalOpen}
        setIsAuthModalOpen={setIsAuthModalOpen}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* 分类筛选 */}
        <div className="mb-8">
          <div className="bg-card rounded-lg shadow-md p-6 transition-colors duration-300">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={!selectedCategory ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent transition-colors duration-300"}
              >
                全部 ({posts.length})
              </Button>
              {allCategories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent transition-colors duration-300"}
                >
                  {category} ({posts.filter(post => post.categoryName === category).length})
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 文章统计 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground transition-colors duration-300">
              {selectedCategory ? `分类 "${selectedCategory}" 的结果：` : ''}
              共找到 {filteredPosts.length} 篇文章
            </p>
            {selectedCategory && (
              <Button
                variant="ghost"
                onClick={() => setSelectedCategory(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                清除筛选
              </Button>
            )}
          </div>
        </div>

        {/* 文章列表 */}
        {filteredPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => {
              const categoryStyle = getCategoryStyle(post.categoryName || '技术分享');

              return (
                <Card
                  key={post.id}
                  className={`bg-white ${categoryStyle.border} ${categoryStyle.hoverBorder} ${categoryStyle.hoverShadow} transition-all duration-300 hover:scale-[1.03] cursor-pointer overflow-hidden`}
                  onClick={() => handlePostClick(post.id)}
                >
                  {/* 卡片头部 */}
                  <div className={`${categoryStyle.headerBg} p-4 border-b ${categoryStyle.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${categoryStyle.badgeColor} font-semibold text-xs px-2 py-1`}>
                        {post.categoryName || '未分类'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{post.date}</span>
                    </div>
                    <CardTitle className={`${categoryStyle.titleColor} hover:text-opacity-80 transition-colors text-lg font-semibold line-clamp-2`}>
                      {post.title}
                    </CardTitle>
                  </div>

                  <CardContent className="p-4">
                    <CardDescription className="text-muted-foreground mb-3 line-clamp-3">
                      {post.excerpt}
                    </CardDescription>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs border-border text-muted-foreground">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {post.views}
                        </span>
                        <span
                          className={`flex items-center cursor-pointer transition-colors duration-300 ${
                            isAuthenticated && likedPosts.has(post.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          onClick={(e) => handleLike(post.id, e)}
                        >
                          <Heart className={`w-3 h-3 mr-1 ${isAuthenticated && likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          {post.likes}
                        </span>
                        <span className="flex items-center">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          {post.comments}
                        </span>
                      </div>
                      <span className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        {post.readTime}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-muted-foreground rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">没有找到相关文章</h3>
              <p className="text-muted-foreground">
                {selectedCategory ? '当前分类下没有文章' : '暂时没有文章'}
              </p>
            </div>
            {selectedCategory && (
              <Button
                onClick={() => setSelectedCategory(null)}
                variant="outline"
                className="mt-4"
              >
                查看全部文章
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default SearchPage;