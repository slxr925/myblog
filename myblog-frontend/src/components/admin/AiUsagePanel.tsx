import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, Sparkles, UserCircle2 } from 'lucide-react'
import { api } from '../../utils/api'
import type { AiUsageUserVO } from '../../types/api'
import { AdminEmptyState, AdminSectionCard, AdminStatCard } from './AdminUI'

export const AiUsagePanel: React.FC = () => {
  const [topUsers, setTopUsers] = useState<AiUsageUserVO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin
      .getAiUsageTopUsers(7, 10)
      .then(setTopUsers)
      .catch(() => setTopUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const totalRequests = useMemo(
    () => topUsers.reduce((sum, user) => sum + (user.requestCount || 0), 0),
    [topUsers],
  )
  const totalTokens = useMemo(
    () => topUsers.reduce((sum, user) => sum + (user.tokenCount || 0), 0),
    [topUsers],
  )
  const busiestUser = topUsers[0]

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载 AI 使用统计...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard label="总请求数" value={totalRequests} detail="最近 7 天 Top 用户累计请求" icon={Sparkles} />
        <AdminStatCard label="总 Token 数" value={totalTokens} detail="最近 7 天 Top 用户累计消耗" icon={BarChart3} />
        <AdminStatCard label="最高活跃用户" value={busiestUser?.username || '-'} detail={busiestUser ? `${busiestUser.requestCount} 次请求` : '暂无活跃用户'} icon={UserCircle2} />
      </div>

      <AdminSectionCard title="AI 使用排行榜" description="聚焦最近 7 天最活跃的 AI 使用者，帮助观察资源消耗热点。">
        {topUsers.length === 0 ? (
          <AdminEmptyState
            title="暂无 AI 使用数据"
            description="最近 7 天没有可展示的请求或统计数据。"
            icon={Sparkles}
          />
        ) : (
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <article key={user.userId} className="rounded-sm border border-border/70 bg-card/75 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Rank {index + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{user.username || user.userId}</h3>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2 md:text-right">
                    <div>
                      <p>请求数</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{user.requestCount}</p>
                    </div>
                    <div>
                      <p>Token 数</p>
                      <p className="mt-1 text-base font-semibold text-foreground">{user.tokenCount}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminSectionCard>
    </div>
  )
}
