import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Rss } from 'lucide-react';

import BlogListItem from '../components/BlogListItem';
import { Button } from '../components/ui/button';
import type { BlogPost, BlogSortOption, BlogTimeRange, Category } from '../types/api';
import { api, getRssFeedUrl, transformBlogDetailVOToBlogPost } from '../utils/api';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
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
        setError(false);
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
          setError(true);
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
  }, [page, selectedCategoryId, sort, timeRange, retry]);

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
    <div className="py-10 sm:py-12">
      <div className="reading-shell">
        <section className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
          <div>
            <p className="section-kicker mb-4">The archive</p>
            <h1 className="text-4xl sm:text-5xl">全部文章</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">技术分享、项目实践与学习记录，都在这里。</p>
          </div>
          <a href={getRssFeedUrl()} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-accent"><Rss aria-hidden="true" className="h-4 w-4" />订阅更新</a>
        </section>

        <section aria-label="文章筛选" className="border-b border-border py-5">
          <div role="group" aria-label="文章分类" className="flex gap-2 overflow-x-auto pb-3">
            {[{ id: undefined, name: '全部', blogCount: undefined }, ...categories].map(category => (
              <button key={category.id ?? 'all'} type="button" aria-pressed={selectedCategoryId === category.id} onClick={() => handleCategoryChange(category.id)} className={`min-h-11 shrink-0 rounded-sm px-4 text-sm transition-colors ${selectedCategoryId === category.id ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                {category.name}{category.blogCount != null && <span className="ml-2 opacity-70">{category.blogCount}</span>}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">排序
              <select className="filter-select" value={sort} onChange={event => handleSortChange(event.target.value as BlogSortOption)}>{SORT_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">时间
              <select className="filter-select" value={timeRange} onChange={event => handleTimeChange(event.target.value as BlogTimeRange)}>{TIME_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </label>
            {(selectedCategoryId || sort !== 'latest' || timeRange !== 'all') && <Button variant="ghost" onClick={clearFilters}>重置筛选</Button>}
            <p aria-live="polite" className="text-xs text-muted-foreground sm:ml-auto">{loading ? '正在查找文章…' : error ? '暂时无法获取文章' : `${activeCategoryName} · ${total} 篇`}</p>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="flex flex-col gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-52 animate-pulse border border-border bg-card" />
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="border border-border bg-card px-6 py-12 text-center">
              <h2 className="text-xl">文章暂时未能加载</h2>
              <p className="mt-3 text-sm text-muted-foreground">请稍后再试。</p>
              <Button variant="outline" onClick={() => setRetry(value => value + 1)} className="mt-6">重新加载</Button>
            </div>
          ) : posts.length > 0 ? (
            <>
              <div className="flex flex-col">
                {posts.map((post) => (
                  <BlogListItem
                    key={post.id}
                    post={post}
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
