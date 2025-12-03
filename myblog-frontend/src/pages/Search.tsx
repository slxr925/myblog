import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, Heart, MessageCircle, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
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
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openAuthModal } = useAuthModal();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setLoading(true);
        const response = await api.blog.getLatest(50);
        const blogData = Array.isArray(response) ? response : [];

        const formattedPosts = blogData.map((blog: any) => {
          let publishDate = '';
          if (blog.publishTime) {
            try {
              const dateObj = Array.isArray(blog.publishTime)
                ? new Date(blog.publishTime[0], blog.publishTime[1] - 1, blog.publishTime[2])
                : new Date(blog.publishTime);
              publishDate = dateObj.toLocaleDateString('zh-CN');
            } catch (e) { publishDate = '未知日期'; }
          }

          const tags = blog.tags ? blog.tags.map((tag: any) => 
            (typeof tag === 'string' ? tag : tag.name) || ''
          ).filter(Boolean) : [];

          return {
            id: blog.id,
            title: blog.title,
            excerpt: blog.summary || '',
            content: blog.content || '',
            author: blog.authorName || '未知作者',
            date: publishDate,
            readTime: `${Math.ceil((blog.content?.length || 0) / 500)} min`,
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
  }, [isAuthenticated]);

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.categoryName === selectedCategory)
    : posts;

  const allCategories = Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean);

  const handleLike = async (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    try {
      await api.blog.toggleLike(postId);
      const wasLiked = likedPosts.has(postId);
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        wasLiked ? newSet.delete(postId) : newSet.add(postId);
        return newSet;
      });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: wasLiked ? p.likes - 1 : p.likes + 1 } : p));
    } catch (error) { console.error(error); }
  };

    return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">全部文章</h1>
          <p className="text-muted-foreground text-lg">探索所有技术分享、项目实战和学习心得</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
            className="rounded-full"
              >
            全部
              </Button>
              {allCategories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
              className="rounded-full"
                >
              {category}
                </Button>
              ))}
            </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-96 bg-card rounded-3xl animate-pulse border border-border" />)}
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
                className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full cursor-pointer"
              >
                <div className="relative h-56 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-card/90 backdrop-blur-md text-indigo-600 shadow-sm hover:bg-card">
                      {post.categoryName || '未分类'}
                    </Badge>
          </div>
        </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{post.date}</span>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <Clock className="w-4 h-4 ml-1" />
                    <span>{post.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
                      {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-foreground">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span
                        className={`flex items-center gap-1 ${isAuthenticated && likedPosts.has(post.id) ? 'text-red-500' : ''}`}
                          onClick={(e) => handleLike(post.id, e)}
                        >
                        <Heart className={`w-4 h-4 ${isAuthenticated && likedPosts.has(post.id) ? 'fill-current' : ''}`} /> 
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
            <p className="text-muted-foreground">没有找到相关文章</p>
            {selectedCategory && (
              <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">
                查看全部文章
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;