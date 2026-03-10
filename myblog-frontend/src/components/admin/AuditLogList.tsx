import React, { useEffect, useMemo, useState } from 'react'
import { Activity, Clock3, Fingerprint, Shield } from 'lucide-react'
import { api } from '../../utils/api'
import { AdminEmptyState, AdminSectionCard, AdminStatCard } from './AdminUI'

interface AuditLogItem {
  id: number
  operatorId?: number
  action?: string
  targetType?: string
  targetId?: number
  ip?: string
  createTime?: string
}

export const AuditLogList: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin
      .getAuditLogs({ page: 1, size: 50 })
      .then((response: any) => setLogs(response.records || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const uniqueOperators = useMemo(
    () => new Set(logs.map((log) => log.operatorId).filter(Boolean)).size,
    [logs],
  )

  const todayLogs = useMemo(() => {
    const today = new Date().toDateString()
    return logs.filter((log) => {
      const timestamp = log.createTime ? new Date(log.createTime) : null
      return timestamp && !Number.isNaN(timestamp.getTime()) && timestamp.toDateString() === today
    }).length
  }, [logs])

  const formatDateTime = (value?: string) => {
    if (!value) return '未知时间'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载审计轨迹...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard label="日志总数" value={logs.length} detail="当前拉取的审计事件" icon={Shield} />
        <AdminStatCard label="今日记录" value={todayLogs} detail="今天新增的操作轨迹" icon={Clock3} />
        <AdminStatCard label="操作人数量" value={uniqueOperators} detail="当前页内涉及的操作者数" icon={Fingerprint} />
      </div>

      <AdminSectionCard title="审计轨迹" description="查看后台关键操作时间线。">
        {logs.length === 0 ? (
          <AdminEmptyState
            title="暂无审计日志"
            description="当前没有可展示的后台操作轨迹。"
            icon={Activity}
          />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <article key={log.id} className="rounded-sm border border-border/70 bg-card/75 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {log.action || '未知动作'} {log.targetType || '资源'} {log.targetId ? `#${log.targetId}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>操作人：{log.operatorId || '-'}</span>
                      <span>IP：{log.ip || '-'}</span>
                      <span>{formatDateTime(log.createTime)}</span>
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
