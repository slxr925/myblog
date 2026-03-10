import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  FileText,
  FolderOpen,
  Hash,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PenTool,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { cn } from '../../lib/utils'
import { useAuth } from '../../contexts/AuthContext'

type AdminNavKey =
  | 'dashboard'
  | 'blogs'
  | 'comments'
  | 'categories'
  | 'tags'
  | 'users'
  | 'reports'
  | 'audit'
  | 'ai'

interface AdminShellProps {
  activeMenu: AdminNavKey
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  contentClassName?: string
}

const menuItems: Array<{
  id: AdminNavKey
  icon: React.ComponentType<{ className?: string }>
  label: string
}> = [
  { id: 'dashboard', icon: LayoutDashboard, label: '控制台' },
  { id: 'blogs', icon: FileText, label: '文章管理' },
  { id: 'comments', icon: MessageSquare, label: '评论管理' },
  { id: 'categories', icon: FolderOpen, label: '分类管理' },
  { id: 'tags', icon: Hash, label: '标签管理' },
  { id: 'users', icon: Users, label: '用户管理' },
  { id: 'reports', icon: AlertCircle, label: '举报管理' },
  { id: 'audit', icon: Shield, label: '审计日志' },
  { id: 'ai', icon: Sparkles, label: 'AI用量' },
]

export const getMenuHref = (id: AdminNavKey) => {
  return id === 'dashboard' ? '/dashboard' : `/dashboard?tab=${id}`
}

export const AdminShell: React.FC<AdminShellProps> = ({
  activeMenu,
  title,
  description,
  actions,
  children,
  contentClassName,
}) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const activeLabel = useMemo(
    () => menuItems.find((item) => item.id === activeMenu)?.label ?? title,
    [activeMenu, title],
  )

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="admin-shell min-h-screen bg-background text-foreground">
      <div className="admin-shell__noise" />
      <div className="admin-shell__glow admin-shell__glow--primary" />
      <div className="admin-shell__glow admin-shell__glow--secondary" />

      <aside className="admin-sidebar hidden xl:flex">
        <div className="admin-sidebar__body">
          <div className="admin-sidebar__brand">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex w-full items-center gap-4 text-left"
            >
              <span className="admin-sidebar__logo">R</span>
              <span>
                <span className="block font-mono-display text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                  Ops Command
                </span>
                <span className="mt-1 block text-lg font-semibold text-foreground">Ryan Console</span>
              </span>
            </button>
          </div>

          <nav className="admin-sidebar__nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(getMenuHref(item.id))}
                className={cn('admin-sidebar__item', activeMenu === item.id && 'is-active')}
              >
                <span className="admin-sidebar__item-icon">
                  <item.icon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <main className="relative xl:ml-[280px]">
        <div className="border-b border-border/70 bg-background/88 backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Ops Command
              </p>
              <h1 className="mt-1 text-lg font-semibold">{title}</h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              返回前台
            </Button>
          </div>
          <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeMenu === item.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => navigate(getMenuHref(item.id))}
                className="shrink-0"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={cn('relative w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-9', contentClassName)}>
          <header className="admin-page-header">
            <div>
              <p className="font-mono-display text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Operations Console
              </p>
              <h1 className="mt-3 max-w-4xl text-[2rem] font-semibold tracking-[-0.04em] text-foreground md:text-[2.75rem]">
                {title}
              </h1>
              {description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="admin-topbar-account">
                <div>
                  <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    当前账号
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {user?.nickname || user?.username || '管理员'}
                  </p>
                  <p className="text-xs text-muted-foreground">{activeLabel}</p>
                </div>
              </div>
              {actions}
              <Button variant="outline" onClick={handleLogout} className="text-red-700 hover:text-red-800">
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="hidden xl:inline-flex">
                返回前台
              </Button>
            </div>
          </header>

          {children}

          <div className="mt-8 hidden items-center justify-between border-t border-border/70 pt-5 text-xs text-muted-foreground xl:flex">
            <span>{`${location.pathname}${location.search}`}</span>
            <span className="font-mono-display uppercase tracking-[0.28em]">Ryan Control Surface</span>
          </div>
        </div>
      </main>
    </div>
  )
}

interface AdminSectionCardProps {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  eyebrow = 'Workflow',
  title,
  description,
  actions,
}) => {
  return (
    <div className="mb-5 rounded-sm border border-border/70 bg-card/78 px-5 py-4 shadow-[0_18px_42px_hsl(var(--foreground)/0.04)] backdrop-blur sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-2 text-[1.35rem] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </div>
    </div>
  )
}

export const AdminSectionCard: React.FC<AdminSectionCardProps> = ({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}) => {
  return (
    <Card className={cn('admin-panel gap-0 overflow-hidden py-0', className)}>
      {(title || description || action) && (
        <CardHeader className="border-b border-border/70 bg-muted/18 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              {title && <CardTitle className="text-lg tracking-tight">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {action}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn('px-5 py-4 sm:px-6', contentClassName)}>{children}</CardContent>
    </Card>
  )
}

interface AdminToolbarProps {
  children: React.ReactNode
  className?: string
}

export const AdminToolbar: React.FC<AdminToolbarProps> = ({ children, className }) => {
  return <div className={cn('admin-toolbar', className)}>{children}</div>
}

interface AdminStatCardProps {
  label: string
  value: React.ReactNode
  detail?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: 'default' | 'accent' | 'success' | 'danger'
}

export const AdminStatCard: React.FC<AdminStatCardProps> = ({
  label,
  value,
  detail,
  icon: Icon,
}) => {
  return (
    <div className="admin-kpi">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2.5 text-[1.9rem] font-semibold tracking-[-0.04em] text-foreground md:text-[2.15rem]">{value}</p>
          {detail && <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{detail}</p>}
        </div>
        <span className="admin-kpi__icon">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}

interface AdminNoticeProps {
  type: 'success' | 'error' | 'info'
  children: React.ReactNode
}

export const AdminNotice: React.FC<AdminNoticeProps> = ({ type, children }) => {
  const styles = {
    success:
      'border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200',
    error:
      'border-red-200/70 bg-red-50/80 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200',
    info:
      'border-amber-200/70 bg-amber-50/80 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100',
  } as const

  return <div className={cn('rounded-sm border px-4 py-3 text-sm', styles[type])}>{children}</div>
}

interface AdminEmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  action,
  icon: Icon = PenTool,
}) => {
  return (
    <div className="admin-empty-state">
      <span className="admin-empty-state__icon">
        <Icon className="h-6 w-6" />
      </span>
      <div>
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
