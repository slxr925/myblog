import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  Edit2,
  FileText,
  FolderOpen,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '../../utils/api'
import type { Category } from '../../types/api'
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

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [message, setMessage] = useState<MessageState>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!message) {
      return
    }

    const timeoutId = window.setTimeout(() => setMessage(null), 2800)
    return () => window.clearTimeout(timeoutId)
  }, [message])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.admin.getCategories()
      setCategories(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('获取分类失败:', error)
      setCategories([])
      setMessage({ type: 'error', text: '获取分类列表失败，请稍后重试。' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '' })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({ name: '', description: '' })
    setMessage(null)
  }

  const handleEdit = (category: Category) => {
    setIsCreating(false)
    setEditingId(category.id)
    setFormData({
      name: category.name || '',
      description: category.description || '',
    })
    setMessage(null)
  }

  const handleSave = async () => {
    const nextName = formData.name.trim()
    if (!nextName) {
      setMessage({ type: 'error', text: '分类名称不能为空。' })
      return
    }

    const existingCategory = categories.find(
      (category) => category.name === nextName && category.id !== editingId,
    )
    if (existingCategory) {
      setMessage({ type: 'error', text: '分类名称已存在。' })
      return
    }

    try {
      setIsSaving(true)
      if (isCreating) {
        await api.category.create({
          name: nextName,
          description: formData.description.trim(),
        })
        setMessage({ type: 'success', text: '分类已创建。' })
      } else if (editingId) {
        await api.category.update({
          id: editingId,
          name: nextName,
          description: formData.description.trim(),
        })
        setMessage({ type: 'success', text: '分类已更新。' })
      }

      await fetchCategories()
      resetForm()
    } catch (error: any) {
      console.error('保存分类失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '保存分类失败。',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除分类“${name}”吗？此操作不可撤销。`)) {
      return
    }

    try {
      setDeletingId(id)
      await api.category.delete(id)
      setMessage({ type: 'success', text: '分类已删除。' })
      await fetchCategories()
    } catch (error: any) {
      console.error('删除分类失败:', error)
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除分类失败。',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const newCategoriesThisMonth = useMemo(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return categories.filter((category) => {
      const createdAt = new Date(category.createTime || '')
      return createdAt >= thirtyDaysAgo
    }).length
  }, [categories])

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
          <p className="text-muted-foreground">正在加载分类工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AdminStatCard label="总分类数" value={categories.length} detail="当前内容结构总量" icon={FolderOpen} />
        <AdminStatCard label="近30天新增" value={newCategoriesThisMonth} detail="最近一个月新增分类" icon={Calendar} />
        <AdminStatCard label="分组页数" value={categories.length > 0 ? Math.ceil(categories.length / 10) : 0} detail="按 10 项估算的浏览页数" icon={FileText} />
      </div>

      <AnimatePresence>
        {message && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminNotice type={message.type}>{message.text}</AdminNotice>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSectionCard
        title="分类工作台"
        description="维护前台内容结构，统一分类名称和说明，避免出现重复命名。"
        action={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            新建分类
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
                      {isCreating ? '新建分类' : '编辑分类'}
                    </h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">分类名称 *</Label>
                    <Input
                      id="category-name"
                      value={formData.name}
                      onChange={(event) => setFormData((previous) => ({ ...previous, name: event.target.value }))}
                      placeholder="例如：技术分享、项目实战"
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">分类描述</Label>
                    <Input
                      id="category-description"
                      value={formData.description}
                      onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
                      placeholder="用一句话说明该分类的内容边界"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4" />
                    {isSaving ? '保存中...' : '保存分类'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    取消
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {categories.length === 0 ? (
          <AdminEmptyState
            title="还没有分类"
            description="先建立几个稳定的内容分组，再继续运营文章列表和推荐体系。"
            icon={FolderOpen}
            action={
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4" />
                新建分类
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {categories.map((category) => {
              const isDeleting = deletingId === category.id
              return (
                <motion.article
                  key={category.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-sm border border-border/70 bg-card/75 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border/70 bg-muted/35">
                          <FolderOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">分类 ID {category.id}</p>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {category.description || '暂无描述，可补充内容边界说明。'}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="outline">分类</Badge>
                        <Badge variant="secondary">创建于 {formatDate(category.createTime)}</Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                        <Edit2 className="h-4 w-4" />
                        编辑
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(category.id, category.name)}
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
