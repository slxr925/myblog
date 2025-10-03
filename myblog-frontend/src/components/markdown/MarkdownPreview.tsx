import React from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface MarkdownPreviewProps {
  content: string
  maxHeight?: string
  showLineNumbers?: boolean
  enableCopy?: boolean
  className?: string
}

/**
 * Markdown预览组件
 * 用于在列表页面或卡片中显示Markdown内容的预览
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  maxHeight = '200px',
  className = ''
}) => {
  return (
    <div 
      className={`overflow-hidden ${className}`}
      style={{ maxHeight }}
    >
      <div className="relative">
        <MarkdownRenderer
          content={content}
          className="text-sm"
        />
        {/* 渐变遮罩，用于显示内容被截断 */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"
          style={{ 
            background: 'linear-gradient(to top, var(--background) 0%, transparent 100%)' 
          }}
        />
      </div>
    </div>
  )
}

MarkdownPreview.displayName = 'MarkdownPreview'