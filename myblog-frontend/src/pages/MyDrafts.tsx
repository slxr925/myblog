import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import type { BlogDetailVO } from '../types/api';
import { BlogStatus } from '../types/api';
import { Pencil, FileText, RefreshCcw, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

const PAGE_SIZE = 10;

const statusTabs = [
  { label: '全部', value: 'all', status: undefined },
  { label: '草稿', value: 'draft', status: BlogStatus.DRAFT },
  { label: '已发布', value: 'published', status: BlogStatus.PUBLISHED },
  { label: '已下线', value: 'offline', status: BlogStatus.OFFLINE },
];

const formatDateTime = (value?: string) => {
  if (!value) return '未设置';
  try {
    return new Date(value).toLocaleString('zh-CN');
  } catch {
    return value;
  }
};

const MyDrafts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'draft');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [blogs, setBlogs] = useState<BlogDetailVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeStatus = useMemo(() => {
    const tab = statusTabs.find(tab => tab.value === statusFilter);
    return tab?.status;
  }, [statusFilter]);

  useEffect(() => {
    fetchBlogs();
  }, [statusFilter, page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.blog.getMyBlogs({
        page,
        size: PAGE_SIZE,
        status: activeStatus,
      });
      const records = response?.records ?? [];
      setBlogs(records);
      setTotal(response?.total ?? records.length);
    } catch (err) {
      console.error('获取文章列表失败:', err);
      setError('获取文章列表失败，请稍后重试');
      setBlogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }
      return params;
    });
  };

  const handleCreate = () => {
    navigate('/blog/new');
  };

  const handleEdit = (blogId: number) => {
    navigate(`/blog/edit/${blogId}`);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="我的文章" showHero={false} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">我的文章</h1>
            <p className="text-muted-foreground mt-1">
              管理草稿、已发布及已下线的文章，及时回收草稿或继续创作。
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <Button variant="outline" onClick={fetchBlogs}>
              <RefreshCcw className="w-4 h-4 mr-2" />
              刷新
            </Button>
            <Button onClick={handleCreate}>
              <Sparkles className="w-4 h-4 mr-2" />
              写新文章
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {statusTabs.map(tab => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              onClick={() => handleStatusChange(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 text-red-700">
            <CardContent className="p-4">{error}</CardContent>
          </Card>
        )}

        {loading ? (
          <div className="w-full flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : blogs.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2">暂无符合条件的文章</h2>
                <p className="text-muted-foreground">
                  {statusFilter === 'draft'
                    ? '还没有草稿，开始写一篇新文章吧。'
                    : '尝试切换筛选条件，或写一篇新文章。'}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => handleStatusChange('draft')}>
                  查看草稿
                </Button>
                <Button onClick={handleCreate}>
                  <Pencil className="w-4 h-4 mr-2" />
                  新建文章
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {blogs.map(blog => (
              <Card key={blog.id} className="border border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-wrap gap-3 justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-3">
                      <span>{blog.title || '未命名文章'}</span>
                      <Badge variant="secondary">
                        {blog.status === BlogStatus.PUBLISHED
                          ? '已发布'
                          : blog.status === BlogStatus.OFFLINE
                          ? '已下线'
                          : '草稿'}
                      </Badge>
                      {blog.visibility === 0 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          私密
                        </Badge>
                      )}
                      {blog.isTop === 1 && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          置顶
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {blog.summary || '暂无摘要'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleEdit(Number(blog.id))}>
                      <Pencil className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                    {blog.status === BlogStatus.PUBLISHED && (
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/blog/${blog.id}`)}
                        className="text-blue-600"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        查看
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>分类：{blog.categoryName || '未分类'}</span>
                    <span>最后更新：{formatDateTime(blog.updateTime)}</span>
                    {blog.publishTime && (
                      <span>发布时间：{formatDateTime(blog.publishTime)}</span>
                    )}
                  </div>
                  {blog.tags && blog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map(tag => (
                        <Badge key={tag.id} variant="outline">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <div className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 页，共 {total} 篇文章
              </div>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDrafts;

