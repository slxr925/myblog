import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, TrendingUp, History } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { api } from '../utils/api';
import type { BlogPost, SearchTrendVO } from '../types/api';
import BlogListItem from '../components/BlogListItem';

type GenericPagePayload<T> = {
  content?: T[];
  records?: T[];
  totalElements?: number;
  total?: number;
  totalPages?: number;
  pages?: number;
};

type RawSearchBlog = {
  id: number | string;
  publicId?: string;
  title?: string;
  summary?: string;
  content?: string;
  contentSnippet?: string;
  authorNickname?: string;
  authorName?: string;
  publishTime?: string | number[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  tags?: unknown;
  tagNames?: unknown;
  coverImg?: string;
  isTop?: number;
  categoryId?: number;
  categoryName?: string;
  highlightedTitle?: string;
  highlightedSummary?: string;
  highlightedContent?: string;
};

const PAGE_SIZE = 12;
const HISTORY_KEY = 'searchHistory';

const normalizePagePayload = <T,>(payload: unknown): GenericPagePayload<T> => {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return payload as GenericPagePayload<T>;
};

const extractListFromPayload = <T,>(payload: unknown): T[] => {
  const pagePayload = normalizePagePayload<T>(payload);
  if (Array.isArray(pagePayload.content)) return pagePayload.content;
  if (Array.isArray(pagePayload.records)) return pagePayload.records;
  if (Array.isArray(payload)) return payload as T[];
  return [];
};

const extractTotalsFromPayload = (payload: unknown, fallbackLength: number) => {
  const pagePayload = normalizePagePayload<unknown>(payload);
  const total = pagePayload.totalElements ?? pagePayload.total ?? fallbackLength;
  const totalPages = pagePayload.totalPages ?? pagePayload.pages ??
    (PAGE_SIZE > 0 ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1);
  return { total, totalPages };
};

const readHistory = (): string[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const formatBlogPost = (blog: RawSearchBlog): BlogPost => {
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

  const rawTags = Array.isArray(blog.tags) ? blog.tags : (Array.isArray(blog.tagNames) ? blog.tagNames : []);
  const tags = rawTags
    .map((tag: any) => (typeof tag === 'string' ? tag : tag?.name || ''))
    .filter(Boolean);

  const highlightExcerpt = blog.highlightedSummary || blog.highlightedContent;
  const articleContent = blog.content || blog.contentSnippet || '';
  const parsedId = Number(blog.id);

  return {
    id: Number.isNaN(parsedId) ? 0 : parsedId,
    publicId: blog.publicId,
    title: blog.title || '',
    excerpt: blog.summary || blog.contentSnippet || '',
    highlightedTitle: blog.highlightedTitle,
    highlightedExcerpt: highlightExcerpt,
    content: articleContent,
    author: blog.authorNickname || blog.authorName || '未知作者',
    date: publishDate,
    readTime: `${Math.max(1, Math.ceil((articleContent.length || 0) / 500))} min`,
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

const SearchResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('q') || '';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trending, setTrending] = useState<SearchTrendVO[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const writeHistory = useCallback((items: string[]) => {
    const next = items.slice(0, 10);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setHistory(next);
  }, []);

  const fetchPage = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      let rawResponse: unknown;
      if (searchTerm.trim()) {
        rawResponse = await api.search.searchBlogs(
          searchTerm,
          PAGE_SIZE,
          nextPage,
          { track: nextPage === 0, source: 'result' }
        );
      } else {
        rawResponse = await api.blog.getPage({
          page: nextPage + 1,
          size: PAGE_SIZE,
          status: 1
        });
      }

      const list = extractListFromPayload<RawSearchBlog>(rawResponse);
      const formatted = list.map(formatBlogPost);
      const { total, totalPages } = extractTotalsFromPayload(rawResponse, formatted.length);

      setPosts(prev => append ? [...prev, ...formatted] : formatted);
      setTotalMatches(total);
      setPage(nextPage);
      setHasMore(nextPage + 1 < totalPages);
    } catch (error) {
      console.error('获取搜索结果失败:', error);
      if (!append) {
        setPosts([]);
        setTotalMatches(0);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    setSelectedCategory(null);
    fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const current = readHistory();
      const next = [searchTerm.trim(), ...current.filter(item => item !== searchTerm.trim())];
      writeHistory(next);
    }
  }, [searchTerm, writeHistory]);

  useEffect(() => {
    api.search.trending(7, 10)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, []);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) {
      return posts;
    }
    return posts.filter(post => post.categoryName === selectedCategory);
  }, [posts, selectedCategory]);

  const allCategories = useMemo(() => {
    return Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean) as string[];
  }, [posts]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchPage(page + 1, true);
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
        <div className="text-center mb-10">
          <h1 className="text-editorial-lg text-foreground mb-3">
            {searchTerm ? `搜索结果: "${searchTerm}"` : '全部文章'}
          </h1>
          <p className="text-muted-foreground">
            找到了 {totalMatches} 篇相关文章
          </p>
          {searchTerm && (
            <Button variant="link" onClick={() => navigate('/blog')} className="mt-3 text-accent">
              <ArrowLeft className="w-4 h-4 mr-2" />
              查看所有文章
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Card className="rounded-sm border-border">
            <CardContent className="p-4">
              <div className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground">匹配总数</div>
              <div className="text-2xl font-bold text-foreground mt-2">{totalMatches}</div>
            </CardContent>
          </Card>
          <Card className="rounded-sm border-border">
            <CardContent className="p-4">
              <div className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground">分类覆盖</div>
              <div className="text-2xl font-bold text-foreground mt-2">{allCategories.length}</div>
            </CardContent>
          </Card>
          <Card className="rounded-sm border-border">
            <CardContent className="p-4">
              <div className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground">当前筛选</div>
              <div className="text-lg font-bold text-foreground mt-2">{selectedCategory || '全部分类'}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 items-start">
          <section>
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={!selectedCategory ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(null)}
                size="sm"
                className="rounded-full"
              >
                全部
              </Button>
              {allCategories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>

            {loading && posts.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-52 bg-card rounded-sm border border-border animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-0">
                {filteredPosts.map((post, index) => (
                  <BlogListItem
                    key={`${post.id}-${index}`}
                    post={post}
                  />
                ))}
              </div>
            )}

            {!loading && filteredPosts.length === 0 && (
              <div className="text-center py-20 border border-dashed border-border rounded-sm">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">没有找到相关文章</p>
                <Button variant="outline" onClick={() => navigate('/blog')} className="mt-4">
                  查看全部文章
                </Button>
              </div>
            )}

            {hasMore && (
              <div className="pt-6 text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="rounded-sm"
                >
                  {loadingMore ? '加载中...' : '加载更多'}
                </Button>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <Card className="rounded-sm border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <TrendingUp className="w-4 h-4 text-accent" />
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

            <Card className="rounded-sm border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <History className="w-4 h-4 text-accent" />
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
          </aside>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
