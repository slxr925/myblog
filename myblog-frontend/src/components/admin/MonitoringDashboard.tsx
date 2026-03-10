import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Bell,
  Cpu,
  Database,
  MessageSquare,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { api } from '../../utils/api'
import { AdminNotice } from './AdminUI'

interface ArthasSystemMetrics {
  jvmMemoryUsed: number
  jvmMemoryMax: number
  jvmMemoryUsagePercentage: number
  jvmThreadCount: number
  cpuUsage: number
  systemLoadAverage: number
  heapMemory?: {
    used: number
    max: number
    usagePercentage: number
  }
  gcCount?: number
  gcTime?: number
}

interface BusinessMetrics {
  content: {
    draftCount: number
    publishedToday: number
    totalPublished: number
    avgWordCount: number
    publishRate: number
  }
  userActivity: {
    dailyActiveUsers: number
    weeklyActiveUsers: number
    monthlyActiveUsers: number
    retentionRate7d: number
    onlineNow: number
  }
  interaction: {
    commentRate: number
    avgLikesPerBlog: number
    engagementRate: number
    totalInteractions: number
  }
  topBlogs: Array<{
    id: number
    title: string
    viewCount: number
    likeCount: number
    commentCount: number
  }>
  notification: {
    unreadCount: number
    sentToday: number
    openRate: number
    kafkaBacklog: number
  }
}

interface PerformanceMetrics {
  totalRequests: number
  requestsPerSecond: number
  averageResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  errorRate: number
}

interface MonitoringDashboardData {
  arthasMetrics: ArthasSystemMetrics
  performanceMetrics: PerformanceMetrics
  businessMetrics: BusinessMetrics
}

export const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState<MonitoringDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    const interval = window.setInterval(fetchData, 5000)
    return () => window.clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const nextData = await api.admin.getArthasMonitoringDashboard()
      setData(nextData)
      setError(null)
    } catch (fetchError) {
      console.error('获取监控数据失败:', fetchError)
      setError('获取监控数据失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const base = 1024
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1)
    return `${(bytes / Math.pow(base, index)).toFixed(2)} ${units[index]}`
  }

  const riskLabel = useMemo(() => {
    if (!data) return '等待数据'

    const errorRate = data.performanceMetrics.errorRate
    const cpuUsage = data.arthasMetrics.cpuUsage
    const memoryUsage = data.arthasMetrics.jvmMemoryUsagePercentage

    if (errorRate > 2 || cpuUsage > 80 || memoryUsage > 85) return '需要关注'
    if (errorRate > 1 || cpuUsage > 60 || memoryUsage > 70) return '轻度波动'
    return '运行平稳'
  }, [data])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-sm border border-border/70 bg-card/72 p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-muted/80" />
            <div className="mt-5 h-10 w-28 animate-pulse rounded bg-muted/60" />
            <div className="mt-6 h-2 w-full animate-pulse rounded bg-muted/50" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return <AdminNotice type="error">{error || '监控数据不可用。'}</AdminNotice>
  }

  const { arthasMetrics, performanceMetrics, businessMetrics } = data

  const systemCards = [
    {
      label: 'JVM 内存',
      value: `${arthasMetrics.jvmMemoryUsagePercentage.toFixed(1)}%`,
      helper: `${formatBytes(arthasMetrics.jvmMemoryUsed)} / ${formatBytes(arthasMetrics.jvmMemoryMax)}`,
      progress: arthasMetrics.jvmMemoryUsagePercentage,
      icon: Database,
    },
    {
      label: 'CPU 使用率',
      value: `${arthasMetrics.cpuUsage.toFixed(1)}%`,
      helper: `系统负载 ${arthasMetrics.systemLoadAverage >= 0 ? arthasMetrics.systemLoadAverage.toFixed(2) : 'N/A'}`,
      progress: Math.min(arthasMetrics.cpuUsage, 100),
      icon: Cpu,
    },
    {
      label: 'JVM 线程',
      value: arthasMetrics.jvmThreadCount,
      helper: '活跃线程总数',
      progress: null,
      icon: Activity,
    },
    {
      label: '垃圾回收',
      value: arthasMetrics.gcCount ?? 0,
      helper: arthasMetrics.gcTime !== undefined ? `累计 ${arthasMetrics.gcTime.toFixed(0)} ms` : '暂无额外数据',
      progress: null,
      icon: Zap,
    },
  ]

  const performanceCards = [
    {
      label: '请求 QPS',
      value: performanceMetrics.requestsPerSecond.toFixed(1),
      helper: `总请求 ${performanceMetrics.totalRequests.toLocaleString()}`,
      icon: TrendingUp,
    },
    {
      label: '平均响应',
      value: `${performanceMetrics.averageResponseTime.toFixed(0)} ms`,
      helper: `P95 ${performanceMetrics.p95ResponseTime.toFixed(0)} / P99 ${performanceMetrics.p99ResponseTime.toFixed(0)} ms`,
      icon: Activity,
    },
    {
      label: '错误率',
      value: `${performanceMetrics.errorRate.toFixed(2)}%`,
      helper: riskLabel,
      icon: Bell,
      highlight: performanceMetrics.errorRate > 1 ? 'danger' : 'default',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-border/70 bg-muted/18 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Live System
            </p>
            <h3 className="mt-3 text-xl font-semibold">系统与业务态势</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              查看 Arthas 指标、请求状态和业务数据。
            </p>
          </div>
          <div className="rounded-sm border border-border/70 bg-card/75 px-4 py-3 text-right">
            <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              风险状态
            </p>
            <p className="mt-2 text-lg font-semibold">{riskLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {systemCards.map((item) => (
          <div key={item.label} className="rounded-sm border border-border/70 bg-card/76 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{item.value}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.helper}</p>
            {item.progress !== null && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${Math.max(4, item.progress)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {performanceCards.map((item) => (
          <div key={item.label} className="rounded-sm border border-border/70 bg-card/76 p-5">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
                <item.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {item.label}
                </p>
                <p className={item.highlight === 'danger' ? 'mt-1 text-2xl font-semibold tracking-tight text-red-600 dark:text-red-400' : 'mt-1 text-2xl font-semibold tracking-tight'}>
                  {item.value}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{item.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-sm border border-border/70 bg-card/76 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
              <Users className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Business Pulse
              </p>
              <h4 className="mt-1 text-lg font-semibold">业务数据</h4>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-sm border border-border/60 bg-muted/18 p-4">
              <p className="text-sm text-muted-foreground">活跃用户</p>
              <p className="mt-2 text-2xl font-semibold">{businessMetrics.userActivity.dailyActiveUsers}</p>
              <p className="mt-2 text-xs text-muted-foreground">周活 {businessMetrics.userActivity.weeklyActiveUsers} / 月活 {businessMetrics.userActivity.monthlyActiveUsers}</p>
            </div>
            <div className="rounded-sm border border-border/60 bg-muted/18 p-4">
              <p className="text-sm text-muted-foreground">今日发布</p>
              <p className="mt-2 text-2xl font-semibold">{businessMetrics.content.publishedToday}</p>
              <p className="mt-2 text-xs text-muted-foreground">总发布 {businessMetrics.content.totalPublished}</p>
            </div>
            <div className="rounded-sm border border-border/60 bg-muted/18 p-4">
              <p className="text-sm text-muted-foreground">互动总数</p>
              <p className="mt-2 text-2xl font-semibold">{businessMetrics.interaction.totalInteractions}</p>
              <p className="mt-2 text-xs text-muted-foreground">互动率 {businessMetrics.interaction.engagementRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-sm border border-border/60 bg-muted/18 p-4">
              <p className="text-sm text-muted-foreground">未读通知</p>
              <p className="mt-2 text-2xl font-semibold">{businessMetrics.notification.unreadCount}</p>
              <p className="mt-2 text-xs text-muted-foreground">今日发送 {businessMetrics.notification.sentToday}</p>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-border/70 bg-card/76 p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
              <MessageSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Top Content
              </p>
              <h4 className="mt-1 text-lg font-semibold">当前热文</h4>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {businessMetrics.topBlogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无热文数据。</p>
            ) : (
              businessMetrics.topBlogs.slice(0, 5).map((blog, index) => (
                <div key={blog.id} className="rounded-sm border border-border/60 bg-muted/18 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        Rank {index + 1}
                      </p>
                      <h5 className="mt-2 line-clamp-2 text-sm font-semibold leading-6">{blog.title}</h5>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <div>{blog.viewCount} 浏览</div>
                      <div>{blog.likeCount} 点赞</div>
                      <div>{blog.commentCount} 评论</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
