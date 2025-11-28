import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Clock, Heart, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';

const EnhancedBlog = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 数据转换逻辑
  const extractBlogArray = (payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const recordPayload = payload as Record<string, unknown>;
      return (recordPayload.records || recordPayload.content || recordPayload.data || []) as any[];
    }
    return [];
  };

  const convertBlogsToPosts = (blogData: any[]): BlogPost[] => {
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
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const result = await api.blog.getLatest(9);
        const blogData = extractBlogArray(result);
        setPosts(convertBlogsToPosts(blogData));
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Hero Section */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 pointer-events-none" />
        
        <div className="container mx-auto px-4 pt-20 pb-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-6">👋 Welcome to my digital garden</Badge>
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mt-2 mb-8 tracking-tight leading-tight">
                探索技术边界 <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  分享代码与思考
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                这里是 Ryan 的个人博客。我热衷于分享全栈开发、架构设计与 AI 技术落地的心得体会。希望这些文字能给你带来启发。
              </p>
              <div className="flex justify-center gap-4">
                <Button className="px-8 py-6 text-lg rounded-2xl" onClick={() => document.getElementById('posts-grid')?.scrollIntoView({ behavior: 'smooth' })}>
                  开始阅读 <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="secondary" className="px-8 py-6 text-lg rounded-2xl" onClick={() => navigate('/profile')}>
                  关于作者
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      <div id="posts-grid" className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">最新文章</h2>
            <p className="text-slate-500 mt-2">探索最新的深度技术分享</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/blog')}>查看全部 <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
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
                  <div className="absolute top-4 left-4 flex gap-2">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-semibold text-indigo-600 rounded-full shadow-sm">
                        {tag}
                      </span>
                    ))}
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
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-sm">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" /> {post.likes}
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
      </div>
    </div>
  );
};

export default EnhancedBlog;