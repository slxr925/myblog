import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  Calendar,
  CheckCircle,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  PenTool,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { BlogStatus, type BlogDetailVO } from '../../types/api'
import { api } from '../../utils/api'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  AdminEmptyState,
  AdminNotice,
  AdminSectionCard,
  AdminStatCard,
  AdminToolbar,
} from './AdminUI'

interface BlogManagementProps {
  initialStatusFilter?: BlogStatus
}

type MessageState = { type: 'success' | 'error'; text: string } | null

const PAGE_SIZE = 12

export const BlogManagement: React.FC<BlogManagementProps> = ({ initialStatusFilter }) => {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState<BlogDetailVO[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>(initialStatusFilter)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalBlogs, setTotalBlogs] = useState(0)
  const [draftCount, setDraftCount] = useState(0)
  const [publishedCount, setPublishedCount] = useState(0)
  const [offlineCount, setOfflineCount] = useState(0)
  const [message, setMessage] = useState<MessageState>(null)
  const [loadingBlogId, setLoadingBlogId] = useState<number | null>(null)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    setStatusFilter(initialStatusFilter)
  }, [initialStatusFilter])

  useEffect(() => {
    fetchBlogs(isBootstrapping)
  }, [currentPage, debouncedSearchTerm, statusFilter])

  const fetchBlogs = async (firstLoad = false) => {
    try {
      if (firstLoad) {
        setIsBootstrapping(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.admin.getBlogs({
        page: currentPage,
        size: PAGE_SIZE,
        keyword: debouncedSearchTerm || undefined,
        status: statusFilter,
      })

      const responseData = response as any
      const pageResult = responseData.pageResult || response
      const records = Array.isArray(pageResult?.records)
        ? pageResult.records
        : Array.isArray(pageResult?.content)
          ? pageResult.content
          : []

      setBlogs(records)
      setTotalBlogs(pageResult?.total ?? pageResult?.totalElements ?? records.length)
      setDraftCount(Number(responseData.draftCount) || 0)
      setPublishedCount(Number(responseData.publishedCount) || 0)
      setOfflineCount(Number(responseData.offlineCount) || 0)
    } catch (error) {
      console.error('获取文章列表失败:', error)
      setBlogs([])
      setTotalBlogs(0)
      setDraftCount(0)
      setPublishedCount(0)
      setOfflineCount(0)
      setMessage({ type: 'error', text: '获取文章列表失败，请稍后重试。' })
    } finally {
      setIsBootstrapping(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const totalPages = Math.max(1, Math.ceil(totalBlogs / PAGE_SIZE))

  const handleStatusFilter = (nextStatus?: BlogStatus) => {
    setCurrentPage(1)
    setStatusFilter(nextStatus)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleToggleBlogStatus = async (blogId: number, currentStatus: number) => {
    try {
      setLoadingBlogId(blogId)
      const nextStatus =
        currentStatus === BlogStatus.PUBLISHED
          ? BlogStatus.OFFLINE
          : BlogStatus.PUBLISHED

      await api.admin.updateBlogStatus(blogId, nextStatus)
      setMessage({
        type: 'success',
        text: nextStatus === BlogStatus.PUBLISHED ? '文章已重新发布。' : '文章已下线。',
      })
      await fetchBlogs()
    } catch (error: any) {
      console.error('更新文章状态失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '更新文章状态失败。',
      })
    } finally {
      setLoadingBlogId(null)
    }
  }

  const handleDeleteBlog = async (blogId: number, title: string) => {
    if (!window.confirm(`确定要删除这篇文章吗？\n标题：“${title}”\n此操作不可撤销。`)) {
      return
    }

    try {
      setLoadingBlogId(blogId)
      await api.admin.deleteBlog(blogId)
      setMessage({ type: 'success', text: '文章已删除。' })
      await fetchBlogs()
    } catch (error: any) {
      console.error('删除文章失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除文章失败。',
      })
    } finally {
      setLoadingBlogId(null)
    }
  }

  const statusButtons = useMemo(() => ([
    { label: '全部', value: undefined },
    { label: '已发布', value: BlogStatus.PUBLISHED },
    { label: '草稿', value: BlogStatus.DRAFT },
    { label: '已下线', value: BlogStatus.OFFLINE },
  ]), [])

  const getStatusLabel = (status?: number) => {
    switch (status) {
      case BlogStatus.PUBLISHED:
        return '已发布'
      case BlogStatus.OFFLINE:
        return '已下线'
      default:
        return '草稿'
    }
  }

  const getStatusVariant = (status?: number): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case BlogStatus.PUBLISHED:
        return 'default'
      case BlogStatus.OFFLINE:
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载文章工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="总文章数" value={totalBlogs} detail="当前筛选结果总数" icon={FileText} />
        <AdminStatCard label="已发布" value={publishedCount} detail="已上线内容" icon={TrendingUp} tone="success" />
        <AdminStatCard label="草稿" value={draftCount} detail="待继续创作" icon={PenTool} tone="accent" />
        <AdminStatCard label="已下线" value={offlineCount} detail="已撤回内容" icon={Archive} tone="danger" />
      </div>

      <AnimatePresence>{message && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><AdminNotice type={message.type}>{message.text}</AdminNotice></motion.div>}</AnimatePresence>

      <AdminSectionCard
        title="内容工作流"
        description="搜索、筛选并管理文章状态。搜索只刷新列表区域，不再重建输入框。"
      >
        <AdminToolbar>
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="搜索文章标题或摘要..."
                className="h-11 rounded-sm border-border/80 bg-background/70 pl-10 pr-10"
              />
              {isRefreshing && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusButtons.map((button) => (
                <Button
                  key={button.label}
                  size="sm"
                  variant={statusFilter === button.value ? 'default' : 'outline'}
                  onClick={() => handleStatusFilter(button.value as BlogStatus | undefined)}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate('/blog/drafts?status=draft')}>
              <ClipboardList className="h-4 w-4" />
              草稿箱
            </Button>
            <Button onClick={() => navigate('/blog/new')}>
              <PenTool className="h-4 w-4" />
              写文章
            </Button>
          </div>
        </AdminToolbar>
      </AdminSectionCard>

      <AdminSectionCard
        title="文章列表"
        description={`第 ${currentPage} / ${totalPages} 页，共 ${totalBlogs} 篇文章`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}>
              上一页
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}>
              下一页
            </Button>
          </div>
        }
        contentClassName="space-y-4"
      >
        {blogs.length === 0 ? (
          <AdminEmptyState
            title="没有匹配的文章"
            description={debouncedSearchTerm || statusFilter !== undefined
              ? '尝试调整搜索词或状态筛选。'
              : '当前还没有可管理的文章，先创建一篇新文章。'}
            icon={FileText}
            action={
              <Button onClick={() => navigate('/blog/new')}>
                <PenTool className="h-4 w-4" />
                写第一篇文章
              </Button>
            }
          />
        ) : (
          blogs.map((blog) => {
            const isActionLoading = loadingBlogId === blog.id
            const isPublished = blog.status === BlogStatus.PUBLISHED

            return (
              <motion.article
                key={blog.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-sm border border-border/70 bg-card/75 p-5 transition-opacity',
                  isRefreshing && 'opacity-80'
                )}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-xl font-semibold">{blog.title || '未命名文章'}</h3>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {blog.summary || '暂无摘要，建议补充一句更清晰的内容概览。'}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(blog.status)}>{getStatusLabel(blog.status)}</Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-sm border-border/80">
                        分类：{blog.categoryName || '未分类'}
                      </Badge>
                      {blog.isTop === 1 && <Badge variant="outline" className="rounded-sm border-border/80">置顶</Badge>}
                      {blog.visibility === 0 && <Badge variant="outline" className="rounded-sm border-border/80">私密</Badge>}
                      {blog.tags?.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="rounded-sm">
                          #{tag.name}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{blog.publishTime ? new Date(blog.publishTime).toLocaleString('zh-CN') : '未发布'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{blog.viewCount ?? 0} 次浏览</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>文章 ID {blog.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:w-[260px] xl:justify-end">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/blog/edit/${blog.id}`)}>
                      <PenTool className="h-4 w-4" />
                      编辑
                    </Button>
                    {isPublished && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/blog/${blog.id}`)}>
                        <Eye className="h-4 w-4" />
                        查看
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={isPublished ? 'outline' : 'default'}
                      disabled={isActionLoading}
                      onClick={() => handleToggleBlogStatus(Number(blog.id), blog.status || BlogStatus.DRAFT)}
                    >
                      {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
                      {isPublished ? '下线' : '发布'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isActionLoading}
                      onClick={() => handleDeleteBlog(Number(blog.id), blog.title || '未命名文章')}
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  </div>
                </div>
              </motion.article>
            )
          })
        )}
      </AdminSectionCard>
    </div>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
