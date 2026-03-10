import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, FileText, PenTool, RefreshCcw } from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { BlogStatus, type BlogDetailVO } from '../types/api'
import { api } from '../utils/api'
import { AdminEmptyState, AdminSectionCard, AdminShell, AdminStatCard, AdminToolbar } from '../components/admin/AdminUI'

const PAGE_SIZE = 10

const statusTabs = [
  { label: '全部', value: 'all', status: undefined },
  { label: '草稿', value: 'draft', status: BlogStatus.DRAFT },
  { label: '已发布', value: 'published', status: BlogStatus.PUBLISHED },
  { label: '已下线', value: 'offline', status: BlogStatus.OFFLINE },
] as const

const formatDateTime = (value?: string) => {
  if (!value) return '未设置'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

const MyDrafts: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'draft')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [blogs, setBlogs] = useState<BlogDetailVO[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeStatus = useMemo(() => {
    const tab = statusTabs.find((item) => item.value === statusFilter)
    return tab?.status
  }, [statusFilter])

  useEffect(() => {
    fetchBlogs(loading)
  }, [statusFilter, page])

  const fetchBlogs = async (firstLoad = false) => {
    try {
      if (firstLoad) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      setError(null)
      const response = await api.blog.getMyBlogs({
        page,
        size: PAGE_SIZE,
        status: activeStatus,
      })

      const records = response?.records ?? []
      setBlogs(records)
      setTotal(response?.total ?? records.length)
    } catch (error) {
      console.error('获取文章列表失败:', error)
      setError('获取文章列表失败，请稍后重试。')
      setBlogs([])
      setTotal(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (value === 'all') {
        params.delete('status')
      } else {
        params.set('status', value)
      }
      return params
    })
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const publishedCount = blogs.filter((blog) => blog.status === BlogStatus.PUBLISHED).length
  const draftCount = blogs.filter((blog) => blog.status === BlogStatus.DRAFT).length
  const offlineCount = blogs.filter((blog) => blog.status === BlogStatus.OFFLINE).length

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载文章状态中心...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      activeMenu="blogs"
      title="草稿箱"
      description="查看草稿、已发布和已下线文章。"
      actions={
        <>
          <Button variant="outline" onClick={() => navigate('/dashboard?tab=blogs')}>
            <ArrowLeft className="h-4 w-4" />
            返回文章管理
          </Button>
          <Button variant="outline" onClick={() => fetchBlogs()}>
            <RefreshCcw className="h-4 w-4" />
            刷新
          </Button>
          <Button onClick={() => navigate('/blog/new')}>
            <PenTool className="h-4 w-4" />
            写新文章
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <AdminStatCard label="当前总数" value={total} detail={`第 ${page} / ${totalPages} 页`} icon={FileText} />
          <AdminStatCard label="草稿" value={draftCount} detail="待继续创作" icon={PenTool} tone="accent" />
          <AdminStatCard label="已发布" value={publishedCount} detail="已对外可见" icon={CheckCircle2} tone="success" />
          <AdminStatCard label="已下线" value={offlineCount} detail="撤回内容" icon={Eye} tone="danger" />
        </div>

        <AdminSectionCard
          title="文章状态中心"
          description="按状态查看文章并继续编辑。"
        >
          <AdminToolbar>
            <div className="flex flex-wrap gap-2">
              {statusTabs.map((tab) => (
                <Button
                  key={tab.value}
                  variant={statusFilter === tab.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(tab.value)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            {refreshing && <span className="text-sm text-muted-foreground">正在刷新列表...</span>}
          </AdminToolbar>
        </AdminSectionCard>

        {error && (
          <div className="rounded-sm border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <AdminSectionCard
          title="文章列表"
          description={`共 ${total} 篇文章`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
                上一页
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
                下一页
              </Button>
            </div>
          }
          contentClassName="space-y-4"
        >
          {blogs.length === 0 ? (
            <AdminEmptyState
              title="暂无符合条件的文章"
              description={statusFilter === 'draft'
                ? '还没有草稿，开始写一篇新文章吧。'
                : '尝试切换状态筛选，或回到文章管理查看更多内容。'}
              icon={CheckCircle2}
              action={
                <Button onClick={() => navigate('/blog/new')}>
                  <PenTool className="h-4 w-4" />
                  新建文章
                </Button>
              }
            />
          ) : (
            blogs.map((blog) => (
              <article key={blog.id} className={cn('rounded-sm border border-border/70 bg-card/75 p-5', refreshing && 'opacity-80')}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-xl font-semibold">{blog.title || '未命名文章'}</h3>
                      <Badge variant={getStatusVariant(blog.status)}>{getStatusText(blog.status)}</Badge>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {blog.summary || '暂无摘要，可在编辑页补充一句帮助自己快速回忆的概述。'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">分类：{blog.categoryName || '未分类'}</Badge>
                      {blog.visibility === 0 && <Badge variant="outline">私密</Badge>}
                      {blog.isTop === 1 && <Badge variant="outline">置顶</Badge>}
                      {blog.tags?.map((tag) => (
                        <Badge key={tag.id} variant="secondary">
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
                      <span>最后更新：{formatDateTime(blog.updateTime)}</span>
                      {blog.publishTime && <span>发布时间：{formatDateTime(blog.publishTime)}</span>}
                      <span>文章 ID：{blog.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:w-[220px] xl:justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/blog/edit/${blog.id}`)}>
                      <PenTool className="h-4 w-4" />
                      编辑
                    </Button>
                    {blog.status === BlogStatus.PUBLISHED && (
                      <Button size="sm" onClick={() => navigate(`/blog/${blog.id}`)}>
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </AdminSectionCard>
      </div>
    </AdminShell>
  )
}

const getStatusText = (status: number) => {
  switch (status) {
    case BlogStatus.PUBLISHED:
      return '已发布'
    case BlogStatus.OFFLINE:
      return '已下线'
    default:
      return '草稿'
  }
}

const getStatusVariant = (status: number): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case BlogStatus.PUBLISHED:
      return 'default'
    case BlogStatus.OFFLINE:
      return 'destructive'
    default:
      return 'secondary'
  }
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default MyDrafts
