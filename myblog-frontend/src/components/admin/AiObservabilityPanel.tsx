import React, { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Bot, Clock, MessageSquare, Wrench } from 'lucide-react'
import { api } from '../../utils/api'
import type { AiConversationVO, AiObservabilityStatsVO, AiRequestLogVO, AiToolCallVO } from '../../types/api'
import { AdminNotice, AdminSectionCard, AdminStatCard } from './AdminUI'
import { Button } from '../ui/button'

export const AiObservabilityPanel: React.FC = () => {
  const [stats, setStats] = useState<AiObservabilityStatsVO | null>(null)
  const [requests, setRequests] = useState<AiRequestLogVO[]>([])
  const [toolCalls, setToolCalls] = useState<AiToolCallVO[]>([])
  const [conversations, setConversations] = useState<AiConversationVO[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setNotice(null)
    try {
      const [nextStats, requestPage, toolPage, conversationPage] = await Promise.all([
        api.admin.getAiObservabilityStats(7),
        api.admin.getAiRequestLogs({ page: 1, size: 10 }),
        api.admin.getAiToolCalls({ page: 1, size: 10 }),
        api.admin.getAiConversations({ page: 1, size: 10 }),
      ])
      setStats(nextStats)
      setRequests(requestPage.records || [])
      setToolCalls(toolPage.records || [])
      setConversations(conversationPage.records || [])
    } catch (error) {
      console.error('加载AI观测数据失败:', error)
      setNotice('加载 AI 观测数据失败，请检查服务端日志。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载 AI 观测数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {notice && <AdminNotice type="error">{notice}</AdminNotice>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="请求数" value={stats?.requestCount ?? 0} detail="最近 7 天" icon={Activity} />
        <AdminStatCard label="成功" value={stats?.successCount ?? 0} detail="完成的 AI 请求" icon={Bot} />
        <AdminStatCard label="失败" value={stats?.errorCount ?? 0} detail="需要排查" icon={AlertTriangle} />
        <AdminStatCard label="平均耗时" value={`${Math.round(stats?.averageElapsedMs ?? 0)}ms`} detail="端到端耗时" icon={Clock} />
        <AdminStatCard label="工具调用" value={stats?.toolCallCount ?? 0} detail="Function Calling" icon={Wrench} />
        <AdminStatCard label="工具失败" value={stats?.toolErrorCount ?? 0} detail="Tool error" icon={AlertTriangle} />
      </div>

      <AdminSectionCard
        title="AI 请求日志"
        description="展示最近的 Agent 调用、模型、Prompt 版本和工具调用次数。"
        action={<Button type="button" variant="outline" size="sm" onClick={loadData}>刷新</Button>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">时间</th>
                <th className="py-2 pr-3">状态</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2 pr-3">模型</th>
                <th className="py-2 pr-3">Prompt</th>
                <th className="py-2 pr-3">工具</th>
                <th className="py-2 pr-3">耗时</th>
                <th className="py-2 pr-3">错误</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-2 pr-3 text-muted-foreground">{formatDate(item.createTime)}</td>
                  <td className="py-2 pr-3">{statusBadge(item.status)}</td>
                  <td className="py-2 pr-3">{item.action}</td>
                  <td className="py-2 pr-3">{item.model || '-'}</td>
                  <td className="py-2 pr-3">{item.promptKey || '-'} / {item.promptVersion || '-'}</td>
                  <td className="py-2 pr-3">{item.toolCallCount}</td>
                  <td className="py-2 pr-3">{item.elapsedMs}ms</td>
                  <td className="py-2 pr-3 max-w-xs truncate text-red-700">{item.errorMessage || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSectionCard>

      <div className="grid gap-5 xl:grid-cols-2">
        <AdminSectionCard title="工具调用" description="最近的 Spring AI Tool Use 调用。">
          <div className="space-y-2">
            {toolCalls.map((item) => (
              <div key={item.id} className="rounded-sm border border-border/70 bg-muted/18 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{item.toolName}</div>
                  <div className="text-xs text-muted-foreground">{item.elapsedMs}ms</div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {statusBadge(item.status)}
                  <span>{formatDate(item.createTime)}</span>
                </div>
                {item.errorMessage && <p className="mt-2 text-xs text-red-700">{item.errorMessage}</p>}
              </div>
            ))}
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="最近会话" description="服务端持久化的 AI 多轮会话。">
          <div className="space-y-2">
            {conversations.map((item) => (
              <div key={item.conversationId} className="rounded-sm border border-border/70 bg-muted/18 p-3">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title || item.conversationId}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      用户 {item.userId || '-'} · {formatDate(item.updateTime)}
                    </p>
                    {item.summary && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminSectionCard>
      </div>
    </div>
  )
}

const statusBadge = (status?: string) => {
  const ok = status === 'success'
  return (
    <span className={`inline-flex rounded-sm border px-2 py-0.5 text-xs ${ok ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}>
      {status || '-'}
    </span>
  )
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}
