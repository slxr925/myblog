import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Check, EyeOff, Flag, ShieldAlert } from 'lucide-react'
import { api } from '../../utils/api'
import type { ReportVO } from '../../types/api'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  AdminEmptyState,
  AdminNotice,
  AdminSectionCard,
  AdminStatCard,
} from './AdminUI'

type MessageState = { type: 'success' | 'error'; text: string } | null

const getStatusLabel = (status?: number) => {
  switch (status) {
    case 1:
      return '已通过'
    case 2:
      return '已拒绝'
    default:
      return '待处理'
  }
}

export const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<ReportVO[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<MessageState>(null)
  const [reviewingId, setReviewingId] = useState<number | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }
    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getReports({ page: 1, size: 50 })
      setReports(response.records || [])
    } catch (error) {
      console.error('获取举报列表失败:', error)
      setReports([])
      setMessage({ type: 'error', text: '获取举报列表失败，请稍后重试。' })
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (id: number, status: number) => {
    try {
      setReviewingId(id)
      await api.admin.reviewReport(id, { status, action: status === 1 ? 'approve' : 'reject' })
      setReports((previous) => previous.map((report) => (report.id === id ? { ...report, status } : report)))
      setMessage({ type: 'success', text: status === 1 ? '举报已处理为通过。' : '举报已标记为拒绝。' })
    } catch (error) {
      console.error('审核失败:', error)
      setMessage({ type: 'error', text: '审核举报失败，请稍后重试。' })
    } finally {
      setReviewingId(null)
    }
  }

  const pendingCount = useMemo(() => reports.filter((report) => !report.status || report.status === 0).length, [reports])
  const approvedCount = useMemo(() => reports.filter((report) => report.status === 1).length, [reports])
  const rejectedCount = useMemo(() => reports.filter((report) => report.status === 2).length, [reports])

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
          <p className="text-muted-foreground">正在加载举报队列...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <AdminStatCard label="举报总数" value={reports.length} detail="当前拉取到的记录数" icon={Flag} />
        <AdminStatCard label="待处理" value={pendingCount} detail="仍需审核的举报" icon={ShieldAlert} />
        <AdminStatCard label="已通过" value={approvedCount} detail="已执行通过处理" icon={Check} />
        <AdminStatCard label="已拒绝" value={rejectedCount} detail="已驳回的举报" icon={EyeOff} />
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminNotice type={message.type}>{message.text}</AdminNotice>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSectionCard title="举报队列" description="集中处理用户举报，保持审核动作和状态一目了然。">
        {reports.length === 0 ? (
          <AdminEmptyState
            title="暂无举报"
            description="当前没有待处理或已记录的举报。"
            icon={AlertCircle}
          />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const isReviewing = reviewingId === report.id
              return (
                <article key={report.id} className="rounded-sm border border-border/70 bg-card/75 p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          {report.targetType} #{report.targetId}
                        </h3>
                        <Badge variant={report.status === 1 ? 'default' : report.status === 2 ? 'destructive' : 'secondary'}>
                          {getStatusLabel(report.status)}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm text-muted-foreground">
                        <span>举报人：{report.reporterName || report.reporterId || '-'}</span>
                        <span>审核人：{report.reviewerName || report.reviewerId || '-'}</span>
                        <span>创建时间：{formatDateTime(report.createTime)}</span>
                        <span>审核时间：{formatDateTime(report.reviewTime)}</span>
                      </div>

                      <div className="mt-4 rounded-sm border border-border/60 bg-muted/25 p-4">
                        <p className="text-sm font-medium text-foreground">举报原因</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.reason || '未填写原因'}</p>
                        {report.detail && (
                          <>
                            <p className="mt-4 text-sm font-medium text-foreground">详细说明</p>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.detail}</p>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:w-[220px] xl:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isReviewing || report.status === 1}
                        onClick={() => handleReview(report.id, 1)}
                      >
                        <Check className="h-4 w-4" />
                        通过
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isReviewing || report.status === 2}
                        onClick={() => handleReview(report.id, 2)}
                      >
                        <EyeOff className="h-4 w-4" />
                        拒绝
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </AdminSectionCard>
    </div>
  )
}
