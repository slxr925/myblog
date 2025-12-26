import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Clock, Heart, MessageCircle, Calendar, Search, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import { motion } from 'framer-motion';

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

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            {searchTerm ? `搜索结果: "${searchTerm}"` : "全部文章"}
          </h1>
          <p className="text-slate-500">
            找到了 {filteredPosts.length} 篇相关文章
          </p>
          {searchTerm && (
            <Button variant="link" onClick={() => navigate('/blog')} className="mt-4 text-indigo-600">
              <ArrowLeft className="w-4 h-4 mr-2" /> 查看所有文章
            </Button>
          )}
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-96 bg-white rounded-3xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/blog/${post.id}`)}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur-md text-indigo-600 shadow-sm">
                      {post.categoryName || '未分类'}
                    </Badge>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    <Clock className="w-4 h-4 ml-1" />
                    <span>{post.readTime}</span>
                  </div>

                  <h3
                    className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: post.highlightedTitle || post.title }}
                  />

                  <p
                    className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1"
                    dangerouslySetInnerHTML={{ __html: post.highlightedExcerpt || post.excerpt }}
                  />



                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
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
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">没有找到相关文章</p>
            <Button variant="outline" onClick={() => navigate('/blog')} className="mt-4">
              查看全部文章
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;