import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  ClipboardList,
  FileText,
  MessageSquare,
  PenTool,
  Sparkles,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { Role, type AdminStatsDTO, BlogStatus } from '../types/api'
import { UserManagement } from '../components/admin/UserManagement'
import { BlogManagement } from '../components/admin/BlogManagement'
import { CommentManagement } from '../components/admin/CommentManagement'
import { CategoryManagement } from '../components/admin/CategoryManagement'
import { TagManagement } from '../components/admin/TagManagement'
import { MonitoringDashboard } from '../components/admin/MonitoringDashboard'
import { ReportManagement } from '../components/admin/ReportManagement'
import { AuditLogList } from '../components/admin/AuditLogList'
import { AiUsagePanel } from '../components/admin/AiUsagePanel'
import { AiObservabilityPanel } from '../components/admin/AiObservabilityPanel'
import { OpenAiConfigPanel } from '../components/admin/OpenAiConfigPanel'
import { ActivityChart } from '../components/charts/ActivityChart'
import {
  AdminPageHeader,
  AdminSectionCard,
  AdminShell,
  AdminStatCard,
} from '../components/admin/AdminUI'

type AdminView =
  | 'dashboard'
  | 'users'
  | 'blogs'
  | 'comments'
  | 'categories'
  | 'tags'
  | 'reports'
  | 'audit'
  | 'ai'
  | 'ai-observability'
  | 'openai'

const ADMIN_VIEWS: AdminView[] = [
  'dashboard',
  'users',
  'blogs',
  'comments',
  'categories',
  'tags',
  'reports',
  'audit',
  'ai',
  'ai-observability',
  'openai',
]

const isValidAdminView = (value: string | null): value is AdminView => {
  return value !== null && ADMIN_VIEWS.includes(value as AdminView)
}

const parseStatusParam = (value: string | null): BlogStatus | undefined => {
  if (!value) return undefined
  switch (value.toLowerCase()) {
    case 'draft':
      return BlogStatus.DRAFT
    case 'published':
      return BlogStatus.PUBLISHED
    case 'offline':
      return BlogStatus.OFFLINE
    default:
      return undefined
  }
}

const renderTitle = (view: AdminView) => {
  switch (view) {
    case 'users':
      return '用户管理'
    case 'blogs':
      return '文章管理'
    case 'comments':
      return '评论管理'
    case 'categories':
      return '分类管理'
    case 'tags':
      return '标签管理'
    case 'reports':
      return '举报管理'
    case 'audit':
      return '审计日志'
    case 'ai':
      return 'AI用量'
    case 'ai-observability':
      return 'AI观测'
    case 'openai':
      return 'AI配置'
    default:
      return '控制台'
  }
}

export const Admin: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStatsDTO>({
    totalUsers: 0,
    totalBlogs: 0,
    totalComments: 0,
    totalLikes: 0,
    todayViews: 0,
    todayNewUsers: 0,
    todayNewBlogs: 0,
    todayNewComments: 0,
    weeklyStats: [],
    monthlyStats: [],
  })

  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const currentView = useMemo<AdminView>(() => {
    const tabParam = params.get('tab')
    return isValidAdminView(tabParam) ? tabParam : 'dashboard'
  }, [params])
  const initialBlogStatus = useMemo(
    () => parseStatusParam(params.get('status')),
    [params],
  )

  useEffect(() => {
    if (currentView !== 'dashboard') {
      return
    }

    fetchStats()
    api.admin.trackVisit('/admin/dashboard').catch(console.warn)
  }, [currentView])

  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats()
      setStats(response)
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  if (!user || user.role !== Role.ADMIN) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="admin-panel w-full max-w-md rounded-sm border px-8 py-10 text-center">
          <h2 className="text-2xl font-semibold text-foreground">访问被拒绝</h2>
          <p className="mt-3 text-muted-foreground">您没有访问此页面的权限。</p>
          <Button onClick={() => navigate('/')} className="mt-6 w-full">
            返回首页
          </Button>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement />
      case 'blogs':
        return <BlogManagement initialStatusFilter={initialBlogStatus} />
      case 'comments':
        return <CommentManagement />
      case 'categories':
        return <CategoryManagement />
      case 'tags':
        return <TagManagement />
      case 'reports':
        return <ReportManagement />
      case 'audit':
        return <AuditLogList />
      case 'ai':
        return <AiUsagePanel />
      case 'ai-observability':
        return <AiObservabilityPanel />
      case 'openai':
        return <OpenAiConfigPanel />
      default:
        return renderDashboard()
    }
  }

  const renderDashboard = () => {
    const today = new Intl.DateTimeFormat('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    }).format(new Date())

    const publishPulse = stats.totalBlogs
      ? Math.round((stats.todayNewBlogs / stats.totalBlogs) * 1000) / 10
      : 0
    const interactionPulse = stats.totalComments + stats.totalLikes
    const trendSummary = [
      { label: '今日新增用户', value: stats.todayNewUsers, icon: UserPlus },
      { label: '今日新增文章', value: stats.todayNewBlogs, icon: FileText },
      { label: '今日新增评论', value: stats.todayNewComments, icon: MessageSquare },
      { label: '今日浏览量', value: stats.todayViews, icon: TrendingUp },
    ]
    const workflowLanes = [
      {
        eyebrow: 'Content Lane',
        title: '创作与发布',
        description: `当前共有 ${stats.totalBlogs} 篇文章，今日新增 ${stats.todayNewBlogs} 篇。继续创作或回到文章工作台处理发布。`,
        icon: PenTool,
        primaryLabel: '新建文章',
        primaryAction: () => navigate('/blog/new'),
        secondaryLabel: '文章管理',
        secondaryAction: () => navigate('/dashboard?tab=blogs'),
      },
      {
        eyebrow: 'Community Lane',
        title: '互动与治理',
        description: `今日评论新增 ${stats.todayNewComments} 条，今日新增用户 ${stats.todayNewUsers} 人。适合优先检查评论、举报与审计轨迹。`,
        icon: MessageSquare,
        primaryLabel: '评论管理',
        primaryAction: () => navigate('/dashboard?tab=comments'),
        secondaryLabel: '举报管理',
        secondaryAction: () => navigate('/dashboard?tab=reports'),
      },
      {
        eyebrow: 'Taxonomy Lane',
        title: '分类与标签',
        description: '统一维护内容结构，让前台列表、推荐与搜索具备更清晰的信息边界。',
        icon: CalendarDays,
        primaryLabel: '分类管理',
        primaryAction: () => navigate('/dashboard?tab=categories'),
        secondaryLabel: '标签管理',
        secondaryAction: () => navigate('/dashboard?tab=tags'),
      },
      {
        eyebrow: 'Intelligence Lane',
        title: 'AI 与审计',
        description: '查看 AI 请求热点、审计记录和系统状态。',
        icon: Sparkles,
        primaryLabel: 'AI 用量',
        primaryAction: () => navigate('/dashboard?tab=ai'),
        secondaryLabel: 'AI 配置',
        secondaryAction: () => navigate('/dashboard?tab=openai'),
      },
    ]

    return (
      <div className="space-y-5">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.88fr)]">
          <AdminSectionCard className="overflow-hidden" contentClassName="space-y-5">
            <div className="rounded-sm border border-border/70 bg-muted/18 p-4 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl xl:min-w-0 xl:flex-1">
                  <p className="font-mono-display text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Command Deck
                  </p>
                  <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] md:text-[2.4rem]">
                    控制台总览
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{today}。查看内容、互动、系统状态和趋势概况。</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap xl:ml-6 xl:flex-none">
                  <Button variant="outline" size="sm" onClick={() => navigate('/blog/new')}>
                    <PenTool className="h-4 w-4" />
                    写文章
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/blog/drafts?status=draft')}>
                    <ClipboardList className="h-4 w-4" />
                    草稿箱
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard?tab=comments')}>
                    <MessageSquare className="h-4 w-4" />
                    处理评论
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2 2xl:grid-cols-4">
                <AdminStatCard label="总用户数" value={stats.totalUsers} detail={`今日新增 ${stats.todayNewUsers}`} icon={Users} />
                <AdminStatCard label="总文章数" value={stats.totalBlogs} detail={`今日新增 ${stats.todayNewBlogs}`} icon={FileText} />
                <AdminStatCard label="总评论数" value={stats.totalComments} detail={`今日新增 ${stats.todayNewComments}`} icon={MessageSquare} />
                <AdminStatCard label="总点赞数" value={stats.totalLikes} detail="累计互动" icon={ThumbsUp} />
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              <div className="rounded-sm border border-border/70 bg-card/76 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/45">
                    <Activity className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Publish Pulse
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">内容发布节奏</h3>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-sm border border-border/60 bg-muted/18 p-3.5">
                    <p className="text-sm text-muted-foreground">今日发布占比</p>
                    <p className="mt-2 text-[1.7rem] font-semibold tracking-tight">{publishPulse}%</p>
                  </div>
                  <div className="rounded-sm border border-border/60 bg-muted/18 p-3.5">
                    <p className="text-sm text-muted-foreground">累计浏览量</p>
                    <p className="mt-2 text-[1.7rem] font-semibold tracking-tight">{stats.todayViews}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-sm border border-border/70 bg-card/76 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/45">
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Ops Watch
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">运营关注重点</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-2.5 text-sm">
                  <div className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/18 px-4 py-2.5">
                    <span className="text-muted-foreground">互动总量</span>
                    <span className="text-lg font-semibold">{interactionPulse}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/18 px-4 py-2.5">
                    <span className="text-muted-foreground">本周趋势点数</span>
                    <span className="text-lg font-semibold">{stats.weeklyStats.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/18 px-4 py-2.5">
                    <span className="text-muted-foreground">月度趋势点数</span>
                    <span className="text-lg font-semibold">{stats.monthlyStats.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </AdminSectionCard>

          <div className="grid gap-5 content-start">
            <AdminSectionCard title="今日快照" description="今天的内容、用户和互动变化。">
              <div className="grid gap-2.5">
                {trendSummary.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-between rounded-sm border border-border/60 bg-muted/18 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border/70 bg-card/85">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-sm text-muted-foreground">{label}</span>
                    </div>
                    <span className="text-[1.4rem] font-semibold tracking-tight">{value}</span>
                  </div>
                ))}
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="快速入口" description="常用后台入口。">
              <div className="grid gap-3">
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard?tab=blogs')}>
                  <FileText className="h-4 w-4" />
                  进入文章管理
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/blog/drafts?status=draft')}>
                  <ClipboardList className="h-4 w-4" />
                  打开草稿箱
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard?tab=reports')}>
                  <Bell className="h-4 w-4" />
                  查看举报队列
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard?tab=ai')}>
                  <Sparkles className="h-4 w-4" />
                  查看 AI 用量
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => navigate('/dashboard?tab=openai')}>
                  <Bot className="h-4 w-4" />
                  修改 AI 配置
                </Button>
              </div>
            </AdminSectionCard>
          </div>
        </div>

        <AdminSectionCard title="系统态势" description="查看系统指标和业务数据。">
          <MonitoringDashboard />
        </AdminSectionCard>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.978fr)_minmax(380px,1fr)]">
          <AdminSectionCard title="运营趋势" description="观察最近 7 天与 30 天的内容、用户和互动变化。">
            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
              <ActivityChart data={stats.weeklyStats} title="最近7天活跃度" showLegend={true} />
              <ActivityChart data={stats.monthlyStats} title="最近30天活跃度" showLegend={true} />
            </div>
          </AdminSectionCard>

          <AdminSectionCard title="工作流入口" description="常用内容和治理操作。">
            <div className="grid gap-3 sm:grid-cols-2">
              {workflowLanes.map((lane) => {
                const Icon = lane.icon

                return (
                  <div key={lane.title} className="flex h-full flex-col rounded-sm border border-border/70 bg-muted/18 p-4">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border/70 bg-card/85">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                          {lane.eyebrow}
                        </p>
                        <h3 className="mt-2 text-[1.1rem] font-semibold">{lane.title}</h3>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{lane.description}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button size="sm" onClick={lane.primaryAction}>
                        {lane.primaryLabel}
                      </Button>
                      <Button variant="outline" size="sm" onClick={lane.secondaryAction}>
                        {lane.secondaryLabel}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </AdminSectionCard>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      activeMenu={currentView}
      title={currentView === 'dashboard' ? '控制台' : renderTitle(currentView)}
      description={
        currentView === 'dashboard'
          ? '查看站点概况、运营数据和系统状态。'
          : `欢迎回来，${user?.nickname || '管理员'}。`
      }
    >
      {currentView !== 'dashboard' && (
        <AdminPageHeader
          eyebrow="Workflow"
          title={renderTitle(currentView)}
          description={`欢迎回来，${user?.nickname || '管理员'}。`}
        />
      )}
      <motion.div
        key={`${currentView}:${location.search}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {renderContent()}
      </motion.div>
    </AdminShell>
  )
}
