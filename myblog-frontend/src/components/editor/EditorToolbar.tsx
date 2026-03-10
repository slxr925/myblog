import React, { useState } from 'react'
import {
  Bold,
  Eye,
  EyeOff,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Save,
  SplitSquareHorizontal,
  Strikethrough,
  Underline,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

type ViewMode = 'split' | 'write' | 'preview'

interface EditorToolbarProps {
  content: string
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onContentChange: (content: string) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onSave?: () => void
  onUploadImage?: (file: File) => Promise<string>
  isSaving?: boolean
  isUploading?: boolean
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  content,
  textareaRef,
  onContentChange,
  viewMode,
  onViewModeChange,
  onSave,
  onUploadImage,
  isSaving = false,
  isUploading = false,
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const focusTextarea = () => {
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const insertMarkdown = (before: string, after = '', placeholder = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.slice(start, end) || placeholder
    const nextContent = `${content.slice(0, start)}${before}${selectedText}${after}${content.slice(end)}`

    onContentChange(nextContent)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    })
  }

  const openLinkDialog = () => {
    const textarea = textareaRef.current
    const selectedText = textarea
      ? content.slice(textarea.selectionStart, textarea.selectionEnd) || '链接文本'
      : '链接文本'
    setLinkText(selectedText)
    setLinkUrl('')
    setShowLinkDialog(true)
  }

  const confirmInsertLink = () => {
    const textarea = textareaRef.current
    if (!textarea || !linkUrl.trim()) return
    insertMarkdown(`[${linkText || '链接文本'}](`, ')', linkUrl.trim())
    setShowLinkDialog(false)
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file || !onUploadImage) return

      try {
        const result = await onUploadImage(file)
        insertMarkdown(`![${file.name}](`, ')', result)
        toast.success('图片已插入正文。')
      } catch (error) {
        console.error('图片上传失败:', error)
        toast.error('图片上传失败。')
      }
    }
    input.click()
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('**', '**', '加粗文字')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('*', '*', '斜体文字')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('__', '__', '下划线')}>
            <Underline className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('~~', '~~', '删除线')}>
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('# ', '', '一级标题')}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('## ', '', '二级标题')}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('- ', '', '列表项')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('1. ', '', '列表项')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown('> ', '', '引用内容')}>
            <Quote className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={openLinkDialog}>
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={isUploading} onClick={insertImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={viewMode === 'write' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('write')}>
              <EyeOff className="h-4 w-4" />
              编辑
            </Button>
            <Button variant={viewMode === 'split' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('split')}>
              <SplitSquareHorizontal className="h-4 w-4" />
              分栏
            </Button>
            <Button variant={viewMode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => onViewModeChange('preview')}>
              <Eye className="h-4 w-4" />
              预览
            </Button>
          </div>

          {onSave && (
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-background" /> : <Save className="h-4 w-4" />}
              保存草稿
            </Button>
          )}
        </div>
      </div>

      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-md rounded-sm border border-border bg-background p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">插入链接</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">链接文本</label>
                <input
                  value={linkText}
                  onChange={(event) => setLinkText(event.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">链接地址</label>
                <input
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLinkDialog(false)}>
                取消
              </Button>
              <Button size="sm" onClick={confirmInsertLink} disabled={!linkUrl.trim()}>
                插入
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EditorToolbar
