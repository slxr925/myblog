import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Undo,
  Redo,
  Save,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface EditorToolbarProps {
  content: string;
  onContentChange: (content: string) => void;
  previewMode: boolean;
  onPreviewModeChange: (mode: boolean) => void;
  fullscreenMode: boolean;
  onFullscreenModeChange: (mode: boolean) => void;
  onSave?: () => void;
  onUploadImage?: (file: File) => Promise<string>;
  isSaving?: boolean;
  isUploading?: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  content,
  onContentChange,
  previewMode,
  onPreviewModeChange,
  fullscreenMode,
  onFullscreenModeChange,
  onSave,
  onUploadImage,
  isSaving = false,
  isUploading = false,
}) => {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // 插入Markdown语法
  const insertMarkdown = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    const newText = before + selectedText + after;

    const newContent = content.substring(0, start) + newText + content.substring(end);
    onContentChange(newContent);

    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  }, [content, onContentChange]);

  // 插入标题
  const insertHeading = useCallback((level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertMarkdown(prefix, '', '标题');
  }, [insertMarkdown]);

  // 插入列表
  const insertList = useCallback((ordered: boolean = false) => {
    const prefix = ordered ? '1. ' : '- ';
    insertMarkdown(prefix, '', '列表项');
  }, [insertMarkdown]);

  // 插入引用
  const insertQuote = useCallback(() => {
    insertMarkdown('> ', '', '引用内容');
  }, [insertMarkdown]);

  // 插入代码
  const insertCode = useCallback((block: boolean = false) => {
    if (block) {
      insertMarkdown('```\n', '\n```', '代码块');
    } else {
      insertMarkdown('`', '`', '代码');
    }
  }, [insertMarkdown]);

  // 插入链接
  const insertLink = useCallback(() => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || '链接文本';

    setLinkText(selectedText);
    setShowLinkDialog(true);
  }, [content]);

  // 确认插入链接
  const confirmInsertLink = useCallback(() => {
    const linkMarkdown = `[${linkText}](${linkUrl})`;

    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const newContent = content.substring(0, start) + linkMarkdown + content.substring(start);
      onContentChange(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + linkMarkdown.length);
      }, 0);
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [content, linkText, linkUrl, onContentChange]);

  // 插入图片
  const insertImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onUploadImage) {
        try {
          const imageUrl = await onUploadImage(file);
          const imageMarkdown = `![${file.name}](${imageUrl})`;

          const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
          if (textarea) {
            const start = textarea.selectionStart;
            const newContent = content.substring(0, start) + imageMarkdown + content.substring(start);
            onContentChange(newContent);

            setTimeout(() => {
              textarea.focus();
              textarea.setSelectionRange(start, start + imageMarkdown.length);
            }, 0);
          }

          toast.success('图片插入成功');
        } catch (error) {
          toast.error('图片上传失败');
          console.error('图片上传失败:', error);
        }
      }
    };
    input.click();
  }, [content, onContentChange, onUploadImage]);

  // 撤销/重做（简单实现）
  const undo = useCallback(() => {
    document.execCommand('undo');
  }, []);

  const redo = useCallback(() => {
    document.execCommand('redo');
  }, []);

  return (
    <>
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-2">
          {/* 第一组：文字格式化 */}
          <div className="flex items-center gap-1">
            <div className="flex items-center border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                title="撤销"
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                title="重做"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('**', '**', '粗体文字')}
                title="粗体"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('*', '*', '斜体文字')}
                title="斜体"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('~~', '~~', '删除线文字')}
                title="删除线"
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertMarkdown('__', '__', '下划线文字')}
                title="下划线"
              >
                <Underline className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertCode(false)}
                title="行内代码"
              >
                <Code className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 第二组：标题 */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(1)}
                title="一级标题"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(2)}
                title="二级标题"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertHeading(3)}
                title="三级标题"
              >
                <Heading3 className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 第三组：列表和引用 */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertList(false)}
                title="无序列表"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertList(true)}
                title="有序列表"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertQuote}
                title="引用"
              >
                <Quote className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertCode(true)}
                title="代码块"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* 第四组：插入 */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={insertLink}
                title="插入链接"
              >
                <Link className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={insertImage}
                title="插入图片"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-primary" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 右侧：预览、全屏、保存 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPreviewModeChange(!previewMode)}
              title={previewMode ? '编辑模式' : '预览模式'}
            >
              {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFullscreenModeChange(!fullscreenMode)}
              title={fullscreenMode ? '退出全屏' : '全屏模式'}
            >
              {fullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {onSave && (
              <Button
                variant="default"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                title="保存"
              >
                {isSaving ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-background" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 链接插入对话框 */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">插入链接</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">链接文本</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  placeholder="链接文本"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">链接地址</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full p-2 border border-border rounded-md bg-background"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLinkDialog(false)}
                >
                  取消
                </Button>
                <Button
                  onClick={confirmInsertLink}
                  disabled={!linkUrl.trim()}
                >
                  插入
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorToolbar;