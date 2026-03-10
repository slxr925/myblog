import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Edit2,
  Hash,
  Plus,
  Save,
  Tag as TagIcon,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '../../utils/api'
import type { Tag } from '../../types/api'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  AdminEmptyState,
  AdminNotice,
  AdminSectionCard,
  AdminStatCard,
} from './AdminUI'

type MessageState = { type: 'success' | 'error'; text: string } | null

export const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '' })
  const [message, setMessage] = useState<MessageState>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const fetchTags = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getTags()
      setTags(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('获取标签失败:', error)
      setTags([])
      setMessage({ type: 'error', text: '获取标签列表失败，请稍后重试。' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '' })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({ name: '' })
    setMessage(null)
  }

  const handleEdit = (tag: Tag) => {
    setIsCreating(false)
    setEditingId(tag.id)
    setFormData({ name: tag.name || '' })
    setMessage(null)
  }

  const handleSave = async () => {
    const nextName = formData.name.trim()
    if (!nextName) {
      setMessage({ type: 'error', text: '标签名称不能为空。' })
      return
    }

    const existingTag = tags.find(
      (tag) => tag.name.toLowerCase() === nextName.toLowerCase() && tag.id !== editingId,
    )
    if (existingTag) {
      setMessage({ type: 'error', text: '标签名称已存在。' })
      return
    }

    try {
      setIsSaving(true)
      if (isCreating) {
        await api.tag.create({ name: nextName })
        setMessage({ type: 'success', text: '标签已创建。' })
      } else if (editingId) {
        await api.tag.update({ id: editingId, name: nextName })
        setMessage({ type: 'success', text: '标签已更新。' })
      }

      await fetchTags()
      resetForm()
    } catch (error: any) {
      console.error('保存标签失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '保存标签失败。',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除标签“${name}”吗？此操作不可撤销。`)) {
      return
    }

    try {
      setDeletingId(id)
      await api.tag.delete(id)
      setMessage({ type: 'success', text: '标签已删除。' })
      await fetchTags()
    } catch (error: any) {
      console.error('删除标签失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除标签失败。',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const newTagsThisMonth = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return tags.filter((tag) => {
      const createdAt = new Date(tag.createTime || '')
      return createdAt >= thirtyDaysAgo
    }).length
  }, [tags])

  const formatDate = (value?: string) => {
    if (!value) return '未知'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-CN')
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在加载标签工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard label="总标签数" value={tags.length} detail="当前站点标签总量" icon={Hash} />
        <AdminStatCard label="近30天新增" value={newTagsThisMonth} detail="最近一个月新增标签" icon={Calendar} />
        <AdminStatCard label="分组页数" value={tags.length > 0 ? Math.ceil(tags.length / 10) : 0} detail="按 10 项估算的浏览页数" icon={TagIcon} />
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminNotice type={message.type}>{message.text}</AdminNotice>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSectionCard
        title="标签工作台"
        description="维护标签名称和说明。"
        action={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            新建标签
          </Button>
        }
      >
        <AnimatePresence>
          {(isCreating || editingId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mb-5 rounded-sm border border-border/70 bg-muted/20 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                      Editor
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">
                      {isCreating ? '新建标签' : '编辑标签'}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag-name">标签名称 *</Label>
                  <Input
                    id="tag-name"
                    value={formData.name}
                    onChange={(event) => setFormData({ name: event.target.value })}
                    placeholder="例如：Java、Redis、微服务"
                    maxLength={50}
                  />
                </div>

                <div className="mt-5 flex gap-3">
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? '保存中...' : '保存标签'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {tags.length === 0 ? (
          <AdminEmptyState
            title="还没有标签"
            description="先建立一组稳定的主题词，后续文章编辑和筛选都会更顺手。"
            icon={Hash}
            action={
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                新建标签
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {tags.map((tag) => {
              const isDeleting = deletingId === tag.id
              return (
                <motion.article
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-sm border border-border/70 bg-card/75 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
                          <Hash className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">{tag.name}</h3>
                          <p className="text-sm text-muted-foreground">标签 ID {tag.id}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline">标签</Badge>
                        <Badge variant="secondary">创建于 {formatDate(tag.createTime)}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tag)}>
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(tag.id, tag.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isDeleting ? '删除中...' : '删除'}
                      </Button>
                    </div>
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
