import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, CalendarRange, ChevronLeft, ChevronRight, FileText, Rss, SlidersHorizontal } from 'lucide-react';

import BlogListItem from '../components/BlogListItem';
import { Button } from '../components/ui/button';
import type { BlogPost, BlogSortOption, BlogTimeRange, Category } from '../types/api';
import { api, getRssFeedUrl, transformBlogDetailVOToBlogPost } from '../utils/api';
import { getPublicBlogPath } from '../utils/blogLinks';

const PAGE_SIZE = 12;

const SORT_OPTIONS: Array<{ value: BlogSortOption; label: string }> = [
  { value: 'latest', label: '最新发布' },
  { value: 'popular', label: '阅读最多' },
  { value: 'liked', label: '获赞最多' },
];

const TIME_OPTIONS: Array<{ value: BlogTimeRange; label: string }> = [
  { value: 'all', label: '全部时间' },
  { value: '30d', label: '最近 30 天' },
  { value: '90d', label: '最近 90 天' },
  { value: 'year', label: '今年' },
];

const parsePage = (raw: string | null) => {
  const page = Number(raw ?? '1');
  return Number.isFinite(page) && page > 0 ? page : 1;
};

const parseSort = (raw: string | null): BlogSortOption =>
  raw === 'popular' || raw === 'liked' ? raw : 'latest';

const parseTimeRange = (raw: string | null): BlogTimeRange =>
  raw === '30d' || raw === '90d' || raw === 'year' ? raw : 'all';

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const page = parsePage(searchParams.get('page'));
  const categoryId = searchParams.get('categoryId');
  const selectedCategoryId = categoryId ? Number(categoryId) : undefined;
  const sort = parseSort(searchParams.get('sort'));
  const timeRange = parseTimeRange(searchParams.get('timeRange'));

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [pageResponse, categoryResponse] = await Promise.all([
          api.blog.getPage({
            page,
            size: PAGE_SIZE,
            status: 1,
            categoryId: selectedCategoryId,
            sort,
            timeRange,
          }),
          api.category.getAll(),
        ]);

        if (!active) {
          return;
        }

        setPosts((pageResponse.records || []).map(transformBlogDetailVOToBlogPost));
        setTotal(pageResponse.total || 0);
        setTotalPages(pageResponse.pages || 1);
        setCategories(categoryResponse);
      } catch (error) {
        console.error('获取文章列表失败:', error);
        if (active) {
          setPosts([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [page, selectedCategoryId, sort, timeRange]);

  const activeCategoryName = useMemo(() => {
    const current = categories.find((item) => item.id === selectedCategoryId);
    return current?.name || '全部文章';
  }, [categories, selectedCategoryId]);

  const updateParams = (next: Partial<{ page: number; categoryId?: number; sort: BlogSortOption; timeRange: BlogTimeRange }>) => {
    const params = new URLSearchParams(searchParams);

    const nextPage = next.page ?? page;
    params.set('page', String(nextPage));

    const nextSort = next.sort ?? sort;
    params.set('sort', nextSort);

    const nextTimeRange = next.timeRange ?? timeRange;
    params.set('timeRange', nextTimeRange);

    const nextCategoryId = Object.prototype.hasOwnProperty.call(next, 'categoryId')
      ? next.categoryId
      : selectedCategoryId;

    if (nextCategoryId) {
      params.set('categoryId', String(nextCategoryId));
    } else {
      params.delete('categoryId');
    }

    setSearchParams(params);
  };

  const handleCategoryChange = (value?: number) => {
    updateParams({ categoryId: value, page: 1 });
  };

  const handleSortChange = (value: BlogSortOption) => {
    updateParams({ sort: value, page: 1 });
  };

  const handleTimeChange = (value: BlogTimeRange) => {
    updateParams({ timeRange: value, page: 1 });
  };

  const clearFilters = () => {
    setSearchParams({
      page: '1',
      sort: 'latest',
      timeRange: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative overflow-hidden border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 pattern-editorial-grid opacity-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-accent/10 to-transparent" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-border bg-background text-accent">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.3em] text-accent">Archive Index</p>
              </div>
              <h1 className="text-editorial-xl text-foreground">全部文章</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                分页浏览所有技术分享、项目实践与学习记录，用更轻的加载成本保持更快的阅读体验。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-border bg-background/80 px-4 py-4">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Current Slice</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{total}</p>
                <p className="mt-1 text-sm text-muted-foreground">符合当前筛选条件的文章总数</p>
              </div>
              <a
                href={getRssFeedUrl()}
                target="_blank"
                rel="noreferrer"
                className="group border border-border bg-background/80 px-4 py-4 transition-colors hover:border-accent/60 hover:bg-accent/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center border border-border bg-card text-accent">
                      <Rss className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">RSS Feed</p>
                      <p className="mt-1 text-sm text-muted-foreground">订阅最新文章更新</p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                </div>
              </a>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="border border-border bg-card px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
              <div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Category Index</p>
                <p className="mt-1 text-sm text-muted-foreground">分类来自独立索引，不受当前分页结果影响</p>
              </div>
              <div className="text-right">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Active</p>
                <p className="mt-1 text-sm text-foreground">{activeCategoryName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleCategoryChange(undefined)}
                className={`min-w-[112px] border px-4 py-3 text-left font-mono-display text-[11px] uppercase tracking-[0.22em] transition-all ${
                  !selectedCategoryId
                    ? 'border-accent bg-accent/10 text-accent shadow-[inset_3px_0_0_0_hsl(var(--accent))]'
                    : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`min-w-[112px] border px-4 py-3 text-left font-mono-display text-[11px] uppercase tracking-[0.22em] transition-all ${
                    selectedCategoryId === category.id
                      ? 'border-accent bg-accent/10 text-accent shadow-[inset_3px_0_0_0_hsl(var(--accent))]'
                      : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  <span className="block truncate">{category.name}</span>
                  <span className="mt-1 block text-[10px] normal-case tracking-normal opacity-70">
                    {category.blogCount ?? 0} 篇
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
              <div className="flex h-10 w-10 items-center justify-center border border-border bg-background text-accent">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Sort & Window</p>
                <p className="mt-1 text-sm text-muted-foreground">排序与时间筛选会同步到 URL</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 font-mono-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Sort</p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {SORT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSortChange(option.value)}
                      className={`border px-4 py-3 text-left text-sm transition-colors ${
                        sort === option.value
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-mono-display text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  <CalendarRange className="h-3.5 w-3.5" />
                  Time Range
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTimeChange(option.value)}
                      className={`border px-4 py-3 text-left text-sm transition-colors ${
                        timeRange === option.value
                          ? 'border-accent bg-accent/10 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="outline" onClick={clearFilters} className="w-full rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]">
                重置筛选
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-52 animate-pulse border border-border bg-card" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Result Page</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    第 {page} 页，共 {Math.max(totalPages, 1)} 页
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {posts.map((post, index) => (
                  <BlogListItem
                    key={post.id}
                    post={post}
                    index={index}
                    onClick={() => navigate(getPublicBlogPath(post))}
                  />
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  当前显示第 {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, total)} 篇，共 {total} 篇
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => updateParams({ page: page - 1 })}
                    disabled={page <= 1}
                    className="rounded-none"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateParams({ page: page + 1 })}
                    disabled={page >= totalPages}
                    className="rounded-none"
                  >
                    下一页
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-border bg-card px-6 py-16 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-6 text-2xl font-semibold text-foreground">没有找到相关文章</h2>
              <p className="mt-2 text-muted-foreground">当前筛选条件下没有内容，试试放宽时间范围或切回全部分类。</p>
              <Button onClick={clearFilters} className="mt-6 rounded-none">
                查看全部文章
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SearchPage;
