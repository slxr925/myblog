import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Ban,
  Calendar,
  Loader2,
  Mail,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useAuth } from '../../contexts/AuthContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { Role, UserStatus, type User as UserType } from '../../types/api'
import { api } from '../../utils/api'
import {
  AdminEmptyState,
  AdminNotice,
  AdminSectionCard,
  AdminStatCard,
  AdminToolbar,
} from './AdminUI'

type MessageState = { type: 'success' | 'error'; text: string } | null

const PAGE_SIZE = 12

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [normalCount, setNormalCount] = useState(0)
  const [disabledCount, setDisabledCount] = useState(0)
  const [message, setMessage] = useState<MessageState>(null)
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 350)

  useEffect(() => {
    fetchUsers(isBootstrapping)
  }, [currentPage, debouncedSearchTerm])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const fetchUsers = async (firstLoad = false) => {
    try {
      if (firstLoad) {
        setIsBootstrapping(true)
      } else {
        setIsRefreshing(true)
      }

      const response = await api.admin.getUsers({
        page: currentPage,
        size: PAGE_SIZE,
        keyword: debouncedSearchTerm || undefined,
      })

      const responseData = response as any
      const pageResult = responseData.pageResult || responseData
      const records = Array.isArray(pageResult?.records) ? pageResult.records : []

      setUsers(records)
      setTotalUsers(pageResult?.total ?? records.length)
      setNormalCount(Number(responseData.normalCount) || 0)
      setDisabledCount(Number(responseData.disabledCount) || 0)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      setUsers([])
      setTotalUsers(0)
      setNormalCount(0)
      setDisabledCount(0)
      setMessage({ type: 'error', text: '获取用户列表失败，请稍后重试。' })
    } finally {
      setIsBootstrapping(false)
      setIsRefreshing(false)
    }
  }

  const handleToggleUserStatus = async (userId: number, currentStatus?: number | null) => {
    try {
      setStatusLoadingId(userId)
      const normalizedStatus = currentStatus ?? UserStatus.NORMAL
      const nextStatus =
        normalizedStatus === UserStatus.NORMAL ? UserStatus.DISABLED : UserStatus.NORMAL

      await api.admin.updateUserStatus(userId, nextStatus)
      setMessage({
        type: 'success',
        text: nextStatus === UserStatus.NORMAL ? '用户已启用。' : '用户已禁用。',
      })
      await fetchUsers()
    } catch (error: any) {
      console.error('更新用户状态失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '更新用户状态失败。',
      })
    } finally {
      setStatusLoadingId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const admins = users.filter((user) => (user.role ?? Role.USER) === Role.ADMIN).length

  const formatDate = (value?: string) => {
    if (!value) return '未知'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
  }

  const getInitials = (username?: string, nickname?: string) => {
    const name = nickname || username || 'U'
    return name.slice(0, 2).toUpperCase()
  }

  if (isBootstrapping) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载用户工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="总用户数" value={totalUsers} detail="当前筛选结果总数" icon={Users} />
        <AdminStatCard label="活跃用户" value={normalCount} detail="状态正常的账户" icon={UserCheck} tone="success" />
        <AdminStatCard label="已禁用" value={disabledCount} detail="被限制登录的账户" icon={UserX} tone="danger" />
        <AdminStatCard label="管理员" value={admins} detail="当前页中的后台账户" icon={Shield} tone="accent" />
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminNotice type={message.type}>{message.text}</AdminNotice>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSectionCard
        title="用户检索"
        description="服务端搜索用户名、邮箱与昵称，输入时只刷新列表区。"
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
              placeholder="搜索用户名、邮箱或昵称..."
              className="h-11 rounded-sm border-border/80 bg-background/70 pl-10 pr-10"
            />
            {isRefreshing && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="text-sm text-muted-foreground">第 {currentPage} / {totalPages} 页</div>
        </AdminToolbar>
      </AdminSectionCard>

      <AdminSectionCard
        title="用户列表"
        description={`共 ${totalUsers} 个账户`}
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
        {users.length === 0 ? (
          <AdminEmptyState
            title="没有匹配的用户"
            description={debouncedSearchTerm ? '试试更短的关键词，或改搜邮箱。' : '系统里还没有用户。'}
            icon={Users}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {users.map((user) => {
              const normalizedRole = user.role ?? Role.USER
              const normalizedStatus = user.status ?? UserStatus.NORMAL
              const isStatusLoading = statusLoadingId === user.id
              const isCurrentUser = currentUser?.id === user.id
              const isAdmin = normalizedRole === Role.ADMIN
              const isDisabled = isStatusLoading || isCurrentUser || isAdmin

              let disabledReason = ''
              if (isCurrentUser) {
                disabledReason = '不能修改自己的状态'
              } else if (isAdmin) {
                disabledReason = '不能禁用管理员账户'
              }

              return (
                <motion.article
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'rounded-sm border border-border/70 bg-card/75 p-5',
                    isRefreshing && 'opacity-80',
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-sm">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="rounded-sm bg-muted text-foreground">
                          {getInitials(user.username, user.nickname)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">
                          {user.nickname || user.username || '未命名用户'}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground">@{user.username || 'unknown'}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={normalizedRole === Role.ADMIN ? 'default' : 'secondary'}>
                        {normalizedRole === Role.ADMIN ? '管理员' : '普通用户'}
                      </Badge>
                      <Badge variant={normalizedStatus === UserStatus.NORMAL ? 'default' : 'destructive'}>
                        {normalizedStatus === UserStatus.NORMAL ? '正常' : '已禁用'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3 rounded-sm border border-border/60 bg-muted/35 p-4 text-sm text-muted-foreground">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span>ID {user.id}</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(user.createTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {disabledReason || '可直接在此切换账户状态。'}
                    </p>
                    <Button
                      size="sm"
                      variant={normalizedStatus === UserStatus.NORMAL ? 'destructive' : 'default'}
                      disabled={isDisabled}
                      onClick={() => handleToggleUserStatus(user.id, normalizedStatus)}
                    >
                      {isStatusLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          处理中...
                        </>
                      ) : normalizedStatus === UserStatus.NORMAL ? (
                        <>
                          <Ban className="h-4 w-4" />
                          禁用
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4" />
                          启用
                        </>
                      )}
                    </Button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </AdminSectionCard>
    </div>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
