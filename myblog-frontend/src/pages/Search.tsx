import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Eye, Heart, MessageCircle, Calendar, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { api } from '../utils/api';
import Navigation from '../components/layout/Navigation';
import { useNavigate } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  // 获取搜索结果
  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        let response;

        if (searchTerm.trim()) {
          // 使用关键词搜索
          response = await api.blog.search(searchTerm, 50); // 设置较大的limit，让后端进行智能限制
        } else {
          // 没有搜索词时，获取最新文章
          response = await api.blog.getLatest(50);
        }

        // 处理响应数据
        const blogData = Array.isArray(response) ? response : (response?.data || []);

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
        console.error('获取搜索结果失败:', error);
        setPosts([]); // 出错时设置空数组
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchTerm]); // 只依赖searchTerm，分类过滤在客户端处理

  // 过滤文章
  useEffect(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(post => post.categoryName === selectedCategory);
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedCategory, posts]);

  // 获取所有分类
  const allCategories = Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const handlePostClick = (postId: number) => {
    window.location.href = `/blog/${postId}`;
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
        heroTitle="文章搜索"
        heroSubtitle="探索所有技术分享、项目实战和学习心得"
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

        {/* 搜索结果统计 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground transition-colors duration-300">
              {searchTerm && `搜索 "${searchTerm}" 的结果：`}
              {selectedCategory && `分类 "${selectedCategory}" 的结果：`}
              共找到 {filteredPosts.length} 篇文章
            </p>
            {searchTerm && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setSearchParams({});
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                清除搜索
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
                        <span className="flex items-center text-red-500">
                          <Heart className="w-3 h-3 mr-1" />
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
                {searchTerm ? '尝试使用其他关键词搜索' : '当前分类下没有文章'}
              </p>
            </div>
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
                setSearchParams({});
              }}
              variant="outline"
              className="mt-4"
            >
              重置筛选
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;