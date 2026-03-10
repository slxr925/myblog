import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, PenTool, Sparkles, Upload, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { AdminNotice, AdminSectionCard, AdminShell } from '../admin/AdminUI'
import { MarkdownRenderer } from '../markdown/MarkdownRenderer'
import EditorToolbar from './EditorToolbar'
import { MarkdownShortcutsDialog } from './MarkdownShortcutsDialog'
import { api } from '../../utils/api'
import type { BlogDetailVO, Category, Tag } from '../../types/api'
import { BlogStatus } from '../../types/api'

interface BlogEditorProps {
  mode?: 'create' | 'edit'
}

interface BlogFormData {
  title: string
  summary: string
  content: string
  coverImg: string
  categoryId: number | null
  tags: string[]
  status: number
  visibility: number
}

type ViewMode = 'split' | 'write' | 'preview'

const DEFAULT_FORM: BlogFormData = {
  title: '',
  summary: '',
  content: '',
  coverImg: '',
  categoryId: null,
  tags: [],
  status: BlogStatus.DRAFT,
  visibility: 1,
}

const BlogEditor: React.FC<BlogEditorProps> = ({ mode = 'create' }) => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const autoSaveTimerRef = useRef<number | null>(null)
  const lastSnapshotRef = useRef<string>('')

  const [formData, setFormData] = useState<BlogFormData>(DEFAULT_FORM)
  const [categories, setCategories] = useState<Category[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [tagInput, setTagInput] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [draftId, setDraftId] = useState<number | null>(mode === 'edit' && id ? Number(id) : null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [drafts, setDrafts] = useState<BlogDetailVO[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isPolishing, setIsPolishing] = useState(false)
  const [aiStyle, setAiStyle] = useState('默认')
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const buildSnapshot = (data: BlogFormData = formData) => {
    return JSON.stringify({
      title: data.title,
      summary: data.summary,
      content: data.content,
      coverImg: data.coverImg,
      categoryId: data.categoryId,
      tags: data.tags,
      visibility: data.visibility,
    })
  }

  const formatSavedTime = useMemo(() => {
    if (isAutoSaving) return '正在自动保存...'
    if (!lastSavedAt) return '尚未自动保存'
    return `最近保存于 ${lastSavedAt.toLocaleTimeString('zh-CN', { hour12: false })}`
  }, [isAutoSaving, lastSavedAt])

  const loadDrafts = useCallback(async () => {
    try {
      setDraftsLoading(true)
      const result = await api.blog.getDrafts()
      setDrafts(result || [])
    } catch (error) {
      console.error('获取草稿列表失败:', error)
    } finally {
      setDraftsLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoryResult, tagResult] = await Promise.all([
          api.category.getAll(),
          api.tag.getUsedTags(),
        ])
        setCategories(categoryResult)
        setAvailableTags(tagResult)
      } catch (error) {
        console.error('加载分类和标签失败:', error)
        toast.error('加载分类和标签失败。')
      }
    }

    loadOptions()
    loadDrafts()
  }, [loadDrafts])

  useEffect(() => {
    if (mode !== 'edit' || !id) {
      lastSnapshotRef.current = buildSnapshot(DEFAULT_FORM)
      return
    }

    const loadBlog = async () => {
      try {
        setIsLoading(true)
        const [blog, blogTags] = await Promise.all([
          api.blog.getById(Number(id)),
          api.tag.getTags(Number(id)),
        ])

        const nextFormData: BlogFormData = {
          title: blog.title || '',
          summary: blog.summary || '',
          content: blog.content || '',
          coverImg: blog.coverImg || '',
          categoryId: blog.categoryId || null,
          tags: blogTags.map((tag) => tag.name),
          status: blog.status ?? BlogStatus.DRAFT,
          visibility: blog.visibility ?? 1,
        }

        setFormData(nextFormData)
        setDraftId(Number(id))
        lastSnapshotRef.current = buildSnapshot(nextFormData)
        if (blog.updateTime) {
          setLastSavedAt(new Date(blog.updateTime))
        }
      } catch (error) {
        console.error('加载博客失败:', error)
        toast.error('加载博客失败。')
        navigate('/dashboard?tab=blogs')
      } finally {
        setIsLoading(false)
      }
    }

    loadBlog()
  }, [mode, id, navigate])

  useEffect(() => {
    if (message?.type === 'success') {
      const timeoutId = window.setTimeout(() => setMessage(null), 2400)
      return () => window.clearTimeout(timeoutId)
    }
  }, [message])

  const handleInputChange = <K extends keyof BlogFormData>(field: K, value: BlogFormData[K]) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const addTag = (tagName: string) => {
    const normalizedTag = tagName.trim()
    if (!normalizedTag) return

    setFormData((previous) => {
      if (previous.tags.includes(normalizedTag)) {
        return previous
      }
      return {
        ...previous,
        tags: [...previous.tags, normalizedTag],
      }
    })
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((previous) => ({
      ...previous,
      tags: previous.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const uploadCoverImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB。')
      return
    }

    setIsUploading(true)
    try {
      const response = await api.upload.uploadEditorImage(file)
      handleInputChange('coverImg', response.url)
      toast.success('封面图片上传成功。')
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.error('图片上传失败。')
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }

  const uploadInlineImage = async (file: File): Promise<string> => {
    const response = await api.upload.uploadEditorImage(file)
    return response.url
  }

  const persistBlog = useCallback(async (status: number, silent = false): Promise<BlogDetailVO | null> => {
    if ((!formData.title.trim() || !formData.content.trim()) && !silent) {
      toast.error('请完善文章标题和正文。')
      return null
    }

    if (status === BlogStatus.PUBLISHED && !formData.categoryId) {
      if (!silent) toast.error('发布前请选择分类。')
      return null
    }

    const payload = { ...formData, status }
    const targetId = mode === 'edit' ? Number(id) : draftId
    const savedBlog = targetId
      ? await api.blog.update(targetId, payload)
      : await api.blog.create(payload)

    if (!targetId) {
      setDraftId(savedBlog.id)
    }

    setLastSavedAt(new Date())
    lastSnapshotRef.current = buildSnapshot(payload)
    await loadDrafts()

    if (!silent) {
      setMessage({
        type: 'success',
        text: status === BlogStatus.PUBLISHED ? '文章已发布。' : '草稿已保存。',
      })
    }

    return savedBlog
  }, [draftId, formData, id, loadDrafts, mode])

  const handleSave = async (status: number) => {
    setIsSaving(true)
    try {
      const savedBlog = await persistBlog(status)
      if (!savedBlog) return
      if (status === BlogStatus.PUBLISHED) {
        navigate(`/blog/${savedBlog.id}`)
      }
    } catch (error: any) {
      console.error('保存博客失败:', error)
      toast.error(error.response?.data?.message || error.message || '保存失败，请重试。')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoSaveDraft = useCallback(async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      return
    }
    if (isSaving || isAutoSaving) {
      return
    }

    setIsAutoSaving(true)
    try {
      await persistBlog(BlogStatus.DRAFT, true)
    } catch (error) {
      console.error('自动保存草稿失败:', error)
    } finally {
      setIsAutoSaving(false)
    }
  }, [formData.title, formData.content, isSaving, isAutoSaving, persistBlog])

  useEffect(() => {
    const snapshot = buildSnapshot()
    if (!formData.title && !formData.content) return
    if (snapshot === lastSnapshotRef.current) return

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      handleAutoSaveDraft()
    }, 4000)

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [
    formData.title,
    formData.summary,
    formData.content,
    formData.coverImg,
    formData.categoryId,
    formData.tags,
    formData.visibility,
    handleAutoSaveDraft,
  ])

  const handleGenerateTitle = async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入正文内容。')
      return
    }

    setIsGeneratingTitle(true)
    try {
      const result = await api.ai.generateTitle(formData.content, aiStyle === '默认' ? undefined : aiStyle)
      const title = (result.title || '').trim()
      if (!title) {
        toast.error('标题内容为空，请重试。')
        return
      }
      handleInputChange('title', title)
      toast.success('标题生成成功。')
    } catch (error) {
      console.error('标题生成失败:', error)
      toast.error('标题生成失败。')
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  const handlePolishContent = async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入正文内容。')
      return
    }

    setIsPolishing(true)
    try {
      const result = await api.ai.polishContent(formData.content, aiStyle === '默认' ? undefined : aiStyle)
      const polishedContent = (result.polishedContent || '').trim()
      if (!polishedContent) {
        toast.error('润色结果为空，请重试。')
        return
      }
      handleInputChange('content', polishedContent)
      toast.success('正文润色完成。')
    } catch (error) {
      console.error('文章润色失败:', error)
      toast.error('文章润色失败。')
    } finally {
      setIsPolishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-muted-foreground">正在载入创作工作台...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminShell
      activeMenu="blogs"
      title={mode === 'create' ? '写文章' : '编辑文章'}
      description="把正文创作、发布设置、AI 辅助和草稿管理收在同一工作台里，不再混用前台导航和默认第三方皮肤。"
      actions={
        <>
          <Button variant="outline" onClick={() => navigate('/dashboard?tab=blogs')}>
            返回文章管理
          </Button>
          <Button variant="outline" onClick={() => handleSave(BlogStatus.DRAFT)} disabled={isSaving}>
            保存草稿
          </Button>
          <Button onClick={() => handleSave(BlogStatus.PUBLISHED)} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenTool className="h-4 w-4" />}
            发布文章
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {message && <AdminNotice type={message.type}>{message.text}</AdminNotice>}

        <AdminSectionCard title="创作状态" description="自动保存、预览模式和当前创作状态会集中显示在这里。">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold">{formatSavedTime}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                草稿会在停止输入 4 秒后自动保存。保存和发布都不会丢失当前正文。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{mode === 'create' ? '新建模式' : `编辑模式 #${draftId ?? id}`}</Badge>
              <Badge variant="outline">{viewMode === 'split' ? '分栏视图' : viewMode === 'preview' ? '纯预览' : '纯编辑'}</Badge>
            </div>
          </div>
        </AdminSectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
          <div className="space-y-6">
            <AdminSectionCard title="文章信息" description="先明确标题和摘要，再进入正文撰写。">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="title">文章标题 *</Label>
                  <div className="mt-2 flex flex-col gap-3 md:flex-row">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(event) => handleInputChange('title', event.target.value)}
                      placeholder="请输入文章标题"
                      className="h-12 flex-1 rounded-sm border-border/80 bg-background/70 text-lg font-semibold"
                    />
                    <Button variant="outline" onClick={handleGenerateTitle} disabled={!formData.content || isGeneratingTitle}>
                      {isGeneratingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      AI生成标题
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="summary">文章摘要</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(event) => handleInputChange('summary', event.target.value)}
                    placeholder="写一句帮助读者理解主题的摘要"
                    className="mt-2 min-h-[104px] rounded-sm border-border/80 bg-background/70"
                  />
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              title="正文编辑"
              description="保留 Markdown 存储格式，用后台自有的分栏编辑与预览工作台替代默认第三方外观。"
              action={<MarkdownShortcutsDialog />}
              contentClassName="px-0 py-0"
            >
              <EditorToolbar
                content={formData.content}
                textareaRef={textareaRef}
                onContentChange={(content) => handleInputChange('content', content)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSave={() => handleSave(BlogStatus.DRAFT)}
                onUploadImage={uploadInlineImage}
                isSaving={isSaving}
                isUploading={isUploading}
              />

              <div className={cn('grid gap-px bg-border/70 xl:min-h-[720px]', viewMode === 'split' ? 'xl:grid-cols-2' : 'xl:grid-cols-1')}>
                {viewMode !== 'preview' && (
                  <div className="bg-background">
                    <Textarea
                      ref={textareaRef}
                      value={formData.content}
                      onChange={(event) => handleInputChange('content', event.target.value)}
                      placeholder="在这里写下 Markdown 正文..."
                      className="min-h-[420px] rounded-none border-0 bg-transparent px-5 py-5 text-[15px] leading-7 shadow-none focus-visible:ring-0 xl:min-h-[720px]"
                    />
                  </div>
                )}

                {viewMode !== 'write' && (
                  <div className="bg-muted/15">
                    <div className="h-full overflow-auto px-5 py-5">
                      {formData.content.trim() ? (
                        <MarkdownRenderer content={formData.content} className="prose prose-neutral max-w-none" />
                      ) : (
                        <div className="flex h-full min-h-[360px] items-center justify-center rounded-sm border border-dashed border-border/80 bg-background/50 p-6 text-center text-sm text-muted-foreground">
                          预览区会按照文章详情页的 Markdown 渲染逻辑显示内容。
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </AdminSectionCard>
          </div>

          <div className="space-y-6">
            <AdminSectionCard title="发布设置" description="发布前补齐分类、可见性与封面。">
              <div className="space-y-5">
                <div>
                  <Label>文章分类</Label>
                  <Select
                    value={formData.categoryId?.toString() || ''}
                    onValueChange={(value) => handleInputChange('categoryId', value ? Number(value) : null)}
                  >
                    <SelectTrigger className="mt-2 rounded-sm">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>可见性</Label>
                  <Select
                    value={formData.visibility.toString()}
                    onValueChange={(value) => handleInputChange('visibility', Number(value))}
                  >
                    <SelectTrigger className="mt-2 rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">公开</SelectItem>
                      <SelectItem value="0">仅自己可见</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="coverUpload">封面图片</Label>
                  <p className="mt-2 text-sm text-muted-foreground">建议使用宽图，便于首页列表和文章卡片展示。</p>
                  {formData.coverImg ? (
                    <div className="mt-3 space-y-3">
                      <img src={formData.coverImg} alt="封面图" className="h-48 w-full rounded-sm object-cover" />
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => handleInputChange('coverImg', '')}>
                          移除封面
                        </Button>
                        <label htmlFor="coverUpload" className="flex flex-1 cursor-pointer items-center justify-center rounded-sm border border-border px-3 py-2 text-sm hover:bg-muted/50">
                          重新上传
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="coverUpload" className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border px-4 py-6 text-sm text-muted-foreground hover:bg-muted/40">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      上传封面图片
                    </label>
                  )}
                  <input id="coverUpload" type="file" accept="image/*" className="hidden" onChange={uploadCoverImage} />
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="标签管理" description="添加标签并使用推荐标签快速补全。">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addTag(tagInput)
                      }
                    }}
                    placeholder="输入标签名称"
                    className="rounded-sm"
                  />
                  <Button type="button" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>
                    添加
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer rounded-sm" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">推荐标签</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availableTags
                      .filter((tag) => !formData.tags.includes(tag.name))
                      .slice(0, 10)
                      .map((tag) => (
                        <Badge key={tag.id} variant="outline" className="cursor-pointer rounded-sm hover:bg-muted" onClick={() => addTag(tag.name)}>
                          {tag.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="AI 辅助" description="把生成标题和润色作为辅助动作，下沉到设置面板。">
              <div className="space-y-4">
                <div>
                  <Label>AI 风格</Label>
                  <select
                    value={aiStyle}
                    onChange={(event) => setAiStyle(event.target.value)}
                    className="mt-2 h-10 w-full rounded-sm border border-border bg-background px-3 text-sm"
                  >
                    <option value="默认">默认</option>
                    <option value="简洁专业">简洁专业</option>
                    <option value="技术深度">技术深度</option>
                    <option value="轻松友好">轻松友好</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Button variant="outline" onClick={handleGenerateTitle} disabled={!formData.content || isGeneratingTitle}>
                    {isGeneratingTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI生成标题
                  </Button>
                  <Button variant="outline" onClick={handlePolishContent} disabled={!formData.content || isPolishing}>
                    {isPolishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    AI润色正文
                  </Button>
                </div>
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="最近草稿" description="快速切回最近保存的文章。">
              {draftsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">当前没有草稿，开始创作吧。</p>
              ) : (
                <div className="space-y-3">
                  {drafts.slice(0, 5).map((draft) => (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => navigate(`/blog/edit/${draft.id}`)}
                      className="flex w-full items-center justify-between rounded-sm border border-border/70 bg-muted/20 px-4 py-3 text-left hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{draft.title || '无标题草稿'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(draft.updateTime)}</p>
                      </div>
                      <Badge variant="outline">编辑</Badge>
                    </button>
                  ))}
                </div>
              )}
            </AdminSectionCard>
          </div>
        </div>
      </div>
    </AdminShell>
  )
}

const formatDateTime = (value?: string) => {
  if (!value) return '未设置'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default BlogEditor
