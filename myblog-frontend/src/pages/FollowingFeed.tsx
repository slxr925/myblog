import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import BlogListItem from '../components/BlogListItem';
import { motion } from 'framer-motion';
import { Heart, Users } from 'lucide-react';

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
  };
};

const FollowingFeed: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [recommended, setRecommended] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFollowing(1, true);
  }, []);

  const fetchFollowing = async (pageNum: number, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      }
      const response = await api.blog.getFollowingFeed({ page: pageNum, size: 10 });
      const records = (response as any)?.records ?? (response as any)?.content ?? [];
      const formatted = records.map((blog: any) => formatBlogPost(blog));

      if (reset) {
        setPosts(formatted);
      } else {
        setPosts(prev => [...prev, ...formatted]);
      }

      const total = (response as any)?.total ?? (response as any)?.totalElements ?? formatted.length;
      const size = (response as any)?.size ?? 10;
      const current = (response as any)?.current ?? (response as any)?.number ?? pageNum;
      const totalPages = (response as any)?.pages ?? (response as any)?.totalPages ?? Math.max(1, Math.ceil(total / size));

      setHasMore(current < totalPages);
      setPage(current + 1);

      if (reset && formatted.length === 0) {
        await loadRecommended();
      }
    } catch (error) {
      console.error('获取关注流失败:', error);
      if (reset) {
        setPosts([]);
        await loadRecommended();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async () => {
    try {
      const response = await api.blog.getRecommended(8);
      const data = Array.isArray(response) ? response : [];
      setRecommended(data.map((blog: any) => formatBlogPost(blog)));
    } catch (error) {
      console.error('获取推荐失败:', error);
      setRecommended([]);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 max-w-4xl"
      >
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">关注动态</h1>
          </div>
          <p className="text-muted-foreground text-lg">查看你关注的作者最新动态</p>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-52 bg-card rounded-3xl animate-pulse border border-border" />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="flex flex-col gap-6">
              {posts.map((post, index) => (
                <BlogListItem
                  key={post.id}
                  post={post}
                  index={index}
                  onClick={() => navigate(`/blog/${post.id}`)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button variant="outline" onClick={() => fetchFollowing(page)}>
                  加载更多
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
              <Heart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">还没有关注任何作者</h2>
            <p className="text-muted-foreground mb-6">去看看推荐内容，找到你喜欢的创作者吧。</p>
            <Button onClick={() => navigate('/blog')}>浏览推荐文章</Button>
          </div>
        )}

        {!loading && recommended.length > 0 && posts.length === 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">为你推荐</Badge>
              <span className="text-sm text-muted-foreground">精选热门内容</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommended.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/blog/${post.id}`)}
                  className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-background/90 backdrop-blur text-primary shadow-sm">
                        {post.categoryName || '未分类'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default FollowingFeed;
