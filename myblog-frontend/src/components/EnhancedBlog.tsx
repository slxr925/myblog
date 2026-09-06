import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { api } from '../utils/api';
import type { BlogPost } from '../types/api';
import BlogCard from './BlogCard';
import BlogListItem from './BlogListItem';

const EnhancedBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const extractBlogArray = useCallback((payload: unknown): any[] => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === 'object') {
      const recordPayload = payload as Record<string, unknown>;
      return (recordPayload.records || recordPayload.content || recordPayload.data || []) as any[];
    }
    return [];
  }, []);

  const convertBlogsToPosts = useCallback((blogData: any[]): BlogPost[] => {
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
        publicId: blog.publicId,
        title: blog.title || '未命名文章',
        excerpt: blog.summary || blog.excerpt || '',
        content: blog.content || '',
        author: blog.authorName || blog.authorNickname || '未知作者',
        date: publishDate,
        readTime: `${Math.max(1, Math.ceil(((blog.content || '').length) / 500))} 分钟`,
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
  }, []);

  useEffect(() => {
    let active = true;
    const fetchPosts = async () => {
      setLoading(true);
      setError(false);
      try {
        const result = await api.blog.getLatest(6);
        const blogData = extractBlogArray(result);
        if (active) setPosts(convertBlogsToPosts(blogData));
      } catch (error) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchPosts();
    return () => { active = false; };
  }, [extractBlogArray, convertBlogsToPosts, retry]);

  const leadPost = posts.find(post => post.featured) || posts[0];
  const remainingPosts = posts.filter(post => post.id !== leadPost?.id);

  return (
    <div className="pb-16 sm:pb-24">
      <section className="border-b border-border">
        <div className="reading-shell grid gap-6 pb-block pt-10 sm:pt-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="section-kicker mb-5">Ryan’s Blog / 技术与思考</p>
            <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">在代码里探索，<br className="sm:hidden" />在文字里沉淀。</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">我是 Ryan，在这里记录技术实践、设计思考，以及解决问题的过程。</p>
          </div>
          <Link to="/about" className="reading-link inline-flex min-h-11 items-center gap-3 justify-self-start text-sm hover:text-accent">关于作者 <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </section>

      <section id="posts-grid" aria-labelledby="latest-heading" className="reading-shell pt-block">
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-baseline gap-4">
            <h2 id="latest-heading" className="text-2xl font-semibold">最近的记录</h2>
            <span className="section-kicker hidden sm:inline">Latest stories</span>
          </div>
          <Link to="/blog" className="reading-link inline-flex min-h-11 shrink-0 items-center gap-2 text-sm hover:text-accent">全部文章 <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>

        {loading ? (
          <div role="status" className="grid gap-8 lg:grid-cols-2">
            <span className="sr-only">正在加载文章</span>
            <div aria-hidden="true" className="h-[480px] animate-pulse border border-border bg-muted/50" />
            <div aria-hidden="true" className="space-y-6">{[1, 2, 3].map(i => <div key={i} className="h-36 animate-pulse border-b border-border bg-muted/30" />)}</div>
          </div>
        ) : error ? (
          <div role="alert" className="border border-border bg-card p-10 text-center">
            <h3 className="text-xl">文章暂时未能加载</h3>
            <p className="mt-3 text-sm text-muted-foreground">请稍后再试。</p>
            <Button variant="outline" onClick={() => setRetry(value => value + 1)} className="mt-6">重新加载</Button>
          </div>
        ) : leadPost ? (
          <div className="grid items-start gap-block lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <BlogCard post={leadPost} />
            <div className="min-w-0">{remainingPosts.slice(0, 4).map(post => <BlogListItem key={post.id} post={post} compact />)}</div>
          </div>
        ) : (
          <div className="border border-dashed border-border py-16 text-center">
            <FileText aria-hidden="true" className="mx-auto mb-4 h-8 w-8 text-accent" />
            <h3 className="text-xl">新的记录，即将开始</h3>
            <p className="mt-3 text-sm text-muted-foreground">文章发布后会出现在这里。</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default React.memo(EnhancedBlog);
