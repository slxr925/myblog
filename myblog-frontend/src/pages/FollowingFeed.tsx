import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Heart, Newspaper, Users } from 'lucide-react';

import BlogListItem from '../components/BlogListItem';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';

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
    : (typeof blog.tags === 'string' ? blog.tags.split(',').map((item: string) => item.trim()) : []);

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

      setPosts((prev) => (reset ? formatted : [...prev, ...formatted]));

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

  const activeAuthors = useMemo(() => new Set(posts.map((post) => post.author)).size, [posts]);

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative overflow-hidden border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 pattern-editorial-grid opacity-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-accent/10 to-transparent" />
          <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-border bg-background text-accent">
                  <Users className="h-5 w-5" />
                </div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.3em] text-accent">Following Dispatch</p>
              </div>
              <h1 className="text-editorial-xl text-foreground">关注动态</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                集中查看你关注作者的最新发布，把订阅更新和日常阅读合并到同一条时间线里。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border border-border bg-background/80 px-4 py-4">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Visible Posts</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{posts.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">当前已载入的关注更新</p>
              </div>
              <div className="border border-border bg-background/80 px-4 py-4">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Active Authors</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{activeAuthors}</p>
                <p className="mt-1 text-sm text-muted-foreground">当前动态流里出现的作者数</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-52 animate-pulse border border-border bg-card" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Fresh From Authors</p>
                  <p className="mt-1 text-sm text-muted-foreground">最新关注动态，按发布时间倒序展开</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/notifications')}
                  className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]"
                >
                  查看通知
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

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
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchFollowing(page)}
                    className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]"
                  >
                    加载更多
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="border border-border bg-card px-8 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center border border-border bg-background text-accent">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-foreground">还没有关注任何作者</h2>
              <p className="mt-2 text-muted-foreground">先去发现一些值得持续阅读的创作者，动态流就会开始更新。</p>
              <Button onClick={() => navigate('/blog')} className="mt-6 rounded-none">
                浏览推荐文章
              </Button>
            </div>
          )}
        </section>

        {!loading && recommended.length > 0 && posts.length === 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="rounded-none border border-border bg-background font-mono-display text-[11px] uppercase tracking-[0.2em] text-accent">
                为你推荐
              </Badge>
              <span className="text-sm text-muted-foreground">先从这些热门内容开始</span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {recommended.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/blog/${post.id}`)}
                  className="group cursor-pointer overflow-hidden border border-border bg-card transition-colors hover:border-accent/50"
                >
                  <div className="relative h-44 overflow-hidden border-b border-border">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute left-4 top-4">
                      <Badge className="rounded-none border border-accent/30 bg-background/90 font-mono-display text-[11px] uppercase tracking-[0.18em] text-accent shadow-none backdrop-blur">
                        {post.categoryName || '未分类'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="flex items-center gap-2 font-mono-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Newspaper className="h-3.5 w-3.5 text-accent" />
                      推荐阅读
                    </div>
                    <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-accent">
                      {post.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default FollowingFeed;
