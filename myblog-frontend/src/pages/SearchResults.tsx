import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Heart, MessageCircle, Calendar, Search, ArrowLeft, TrendingUp, History } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { api } from '../utils/api';
import { motion } from 'framer-motion';
import type { SearchTrendVO } from '../types/api';

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
  highlightedTitle?: string;
  highlightedExcerpt?: string;
}

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trending, setTrending] = useState<SearchTrendVO[]>([]);
  const [history, setHistory] = useState<string[]>([]);

  const HISTORY_KEY = 'searchHistory';

  const readHistory = (): string[] => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const writeHistory = (items: string[]) => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 10)));
    setHistory(items.slice(0, 10));
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        let response;

        if (searchTerm.trim()) {
          // 后端已有ES→MySQL降级逻辑，直接调用统一接口
          response = await api.search.searchBlogs(searchTerm, 50);
        } else {
          response = await api.blog.getLatest(50);
        }

        const blogData = Array.isArray(response)
          ? response
          : Array.isArray((response as any)?.content)
            ? (response as any).content
            : [];

        const formattedPosts = blogData.map((blog: any) => formatBlogPost(blog));
        setPosts(formattedPosts);
      } catch (error) {
        console.error('获取搜索结果失败:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchTerm]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const current = readHistory();
      const next = [searchTerm.trim(), ...current.filter(item => item !== searchTerm.trim())];
      writeHistory(next);
    }
  }, [searchTerm]);

  useEffect(() => {
    api.search.trending(7, 10)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, []);

  /**
   * 格式化博客数据
   */
  const formatBlogPost = (blog: any): BlogPost => {
    let publishDate = '';
    if (blog.publishTime) {
      try {
        const dateObj = Array.isArray(blog.publishTime)
          ? new Date(blog.publishTime[0], blog.publishTime[1] - 1, blog.publishTime[2])
          : new Date(blog.publishTime);
        publishDate = dateObj.toLocaleDateString('zh-CN');
      } catch {
        publishDate = '未知日期';
      }
    }

    const tags = Array.isArray(blog.tags)
      ? blog.tags.map((tag: any) => typeof tag === 'string' ? tag : (tag?.name || '')).filter(Boolean)
      : (typeof blog.tags === 'string' ? blog.tags.split(',').map((t: string) => t.trim()) : []);

    return {
      id: Number(blog.id) || blog.id,
      title: blog.title || '',
      excerpt: blog.summary || '',
      content: blog.content || '',
      author: blog.authorNickname || blog.authorName || '未知作者',
      date: publishDate,
      readTime: `${Math.ceil((blog.content?.length || 0) / 500)} min`,
      views: blog.viewCount || 0,
      likes: blog.likeCount || 0,
      comments: blog.commentCount || 0,
      tags,
      image: blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
      featured: blog.isTop === 1,
      categoryId: blog.categoryId,
      categoryName: blog.categoryName,
      highlightedTitle: blog.highlightedTitle,
      highlightedExcerpt: blog.highlightedSummary,
    };
  };

  // 分类过滤（后端已完成关键词搜索，前端只做分类筛选）
  useEffect(() => {
    const filtered = selectedCategory
      ? posts.filter(post => post.categoryName === selectedCategory)
      : posts;
    setFilteredPosts(filtered);
  }, [selectedCategory, posts]);

  const allCategories = Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean);

  const categoryStats = filteredPosts.reduce<Record<string, number>>((acc, post) => {
    if (!post.categoryName) return acc;
    acc[post.categoryName] = (acc[post.categoryName] || 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {searchTerm ? `搜索结果: "${searchTerm}"` : "全部文章"}
          </h1>
          <p className="text-muted-foreground">
            找到了 {filteredPosts.length} 篇相关文章
          </p>
          {searchTerm && (
            <Button variant="link" onClick={() => navigate('/blog')} className="mt-4 text-primary">
              <ArrowLeft className="w-4 h-4 mr-2" /> 查看所有文章
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Filters */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                size="sm"
                className="rounded-full"
              >
                全部
              </Button>
              {allCategories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-96 bg-card rounded-3xl animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/blog/${post.id}`)}
                    className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full cursor-pointer [&>*]:pointer-events-none"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-background/90 backdrop-blur-md text-primary shadow-sm">
                          {post.categoryName || '未分类'}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{post.date}</span>
                        <span className="w-1 h-1 bg-muted rounded-full" />
                        <Clock className="w-4 h-4 ml-1" />
                        <span>{post.readTime}</span>
                      </div>

                      <h3
                        className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: post.highlightedTitle || post.title }}
                      />

                      <p
                        className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 flex-1 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: post.highlightedExcerpt || post.excerpt }}
                      />

                      <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {post.author.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-foreground">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground text-sm">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredPosts.length === 0 && (
              <div className="text-center py-20">
                <Search className="w-12 h-12 text-muted mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">没有找到相关文章</p>
                <Button variant="outline" onClick={() => navigate('/blog')} className="mt-4">
                  查看全部文章
                </Button>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    热门搜索
                  </div>
                  <Badge variant="secondary" className="text-xs">近7天</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {trending.length === 0 ? (
                    <span className="text-sm text-muted-foreground">暂无热词</span>
                  ) : (
                    trending.map(item => (
                      <Button
                        key={item.keyword}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(item.keyword)}`)}
                      >
                        {item.keyword}
                        <span className="ml-2 text-xs text-muted-foreground">{item.count}</span>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <History className="w-4 h-4 text-primary" />
                    最近搜索
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => writeHistory([])}
                    disabled={history.length === 0}
                  >
                    清空
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.length === 0 ? (
                    <span className="text-sm text-muted-foreground">暂无搜索记录</span>
                  ) : (
                    history.map(item => (
                      <Button
                        key={item}
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => navigate(`/search?q=${encodeURIComponent(item)}`)}
                      >
                        {item}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <div className="text-sm font-medium text-foreground">搜索分析</div>
                <div className="text-2xl font-bold text-foreground">{filteredPosts.length}</div>
                <div className="text-xs text-muted-foreground">匹配结果</div>
                <div className="space-y-2">
                  {topCategories.length === 0 ? (
                    <span className="text-sm text-muted-foreground">暂无分类分布</span>
                  ) : (
                    topCategories.map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{name}</span>
                        <span>{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
