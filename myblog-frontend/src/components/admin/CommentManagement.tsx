import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Loader2,
  MessageSquare,
  Search,
  Trash2,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { type CommentVO } from '../../types/api'
import { api } from '../../utils/api'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  AdminEmptyState,
  AdminNotice,
  AdminSectionCard,
  AdminStatCard,
  AdminToolbar,
} from './AdminUI'

type MessageState = { type: 'success' | 'error'; text: string } | null

const PAGE_SIZE = 12

export const CommentManagement: React.FC = () => {
  const [comments, setComments] = useState<CommentVO[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalComments, setTotalComments] = useState(0)
  const [message, setMessage] = useState<MessageState>(null)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    fetchComments(isBootstrapping)
  }, [currentPage, debouncedSearchTerm])

  useEffect(() => {
    if (!message) return
    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const fetchComments = async (firstLoad = false) => {
    try {
      if (firstLoad) {
        setIsBootstrapping(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.admin.getComments({
        page: currentPage,
        size: PAGE_SIZE,
        keyword: debouncedSearchTerm || undefined,
      })

      const records = Array.isArray(response?.records) ? response.records : []
      setComments(records)
      setTotalComments(response?.total ?? records.length)
    } catch (error) {
      console.error('获取评论列表失败:', error)
      setComments([])
      setTotalComments(0)
      setMessage({ type: 'error', text: '获取评论列表失败，请稍后重试。' })
    } finally {
      setIsBootstrapping(false)
      setIsRefreshing(false)
    }
  }

  const handleDeleteComment = async (commentId: number, content: string) => {
    if (!window.confirm(`确定要删除这条评论吗？\n内容：“${content.slice(0, 50)}${content.length > 50 ? '...' : ''}”`)) {
      return
    }

    try {
      await api.admin.deleteComment(commentId)
      setMessage({ type: 'success', text: '评论已删除。' })
      await fetchComments()
    } catch (error: any) {
      console.error('删除评论失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除评论失败。',
      })
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalComments / PAGE_SIZE))
  const recentComments = comments.filter((comment) => {
    const createdAt = new Date(comment.createTime || '')
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)
    return createdAt >= yesterday
  }).length
  const activeAuthors = new Set(comments.map((comment) => comment.username || comment.nickname)).size

  const formatTime = (time?: string) => {
    if (!time) return '未知时间'
    const date = new Date(time)
    return Number.isNaN(date.getTime()) ? time : date.toLocaleString('zh-CN')
  }

  const getInitials = (nickname?: string, username?: string) => {
    const source = nickname || username || 'U'
    return source.slice(0, 2).toUpperCase()
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载评论工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard label="总评论数" value={totalComments} detail="当前筛选结果总数" icon={MessageSquare} />
        <AdminStatCard label="24小时新增" value={recentComments} detail="近一天内写入的评论" icon={Calendar} tone="accent" />
        <AdminStatCard label="活跃评论者" value={activeAuthors} detail="当前页参与用户数" icon={User} tone="success" />
      </div>

      <AnimatePresence>{message && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}><AdminNotice type={message.type}>{message.text}</AdminNotice></motion.div>}</AnimatePresence>

      <AdminSectionCard
        title="评论检索"
        description="搜索评论内容和用户信息。"
      >
        <AdminToolbar>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value)
                setCurrentPage(1)
              }}
              placeholder="搜索评论内容、用户名或昵称..."
              className="h-11 rounded-sm border-border/80 bg-background/70 pl-10 pr-10"
            />
            {isRefreshing && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
          <div className="text-sm text-muted-foreground">第 {currentPage} / {totalPages} 页</div>
        </AdminToolbar>
      </AdminSectionCard>

      <AdminSectionCard
        title="评论列表"
        description={`共 ${totalComments} 条评论`}
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
        {comments.length === 0 ? (
          <AdminEmptyState
            title="没有匹配的评论"
            description={debouncedSearchTerm ? '试试更短的关键词，或改搜用户名。' : '系统里还没有评论。'}
            icon={MessageSquare}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {comments.map((comment) => (
              <motion.article
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-sm border border-border/70 bg-card/75 p-5',
                  isRefreshing && 'opacity-80'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar className="h-11 w-11 rounded-sm">
                      <AvatarImage src={comment.avatar} />
                      <AvatarFallback className="rounded-sm bg-muted text-foreground">
                        {getInitials(comment.nickname, comment.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold">{comment.nickname || comment.username || '匿名用户'}</h3>
                      <p className="truncate text-sm text-muted-foreground">@{comment.username || 'unknown'}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted-foreground">
                    <div>ID {comment.id}</div>
                    <div className="mt-1">文章 {comment.blogId}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-sm border border-border/60 bg-muted/35 p-4">
                  <p className="line-clamp-5 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">
                    {comment.content || '无内容'}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatTime(comment.createTime)}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteComment(comment.id, comment.content || '')}
                  >
                    <Trash2 className="h-4 w-4" />
                    删除评论
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </AdminSectionCard>
    </div>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
