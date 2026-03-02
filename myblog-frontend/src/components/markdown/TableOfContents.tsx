import React, { memo, useEffect, useState, useMemo } from 'react'
import { extractHeadings } from '../../utils/markdown'

interface TableOfContentsProps {
  content: string
  className?: string
  maxDepth?: number
  activeId?: string
  showTitle?: boolean
}

// interface Heading {
//   level: number
//   text: string
//   id: string
// }

/**
 * 文章目录组件
 * 自动提取Markdown内容中的标题，生成可点击的目录导航
 */
export const TableOfContents: React.FC<TableOfContentsProps> = memo(({
  content,
  className = '',
  maxDepth = 4,
  activeId,
  showTitle = true
}) => {
  const [currentActiveId, setCurrentActiveId] = useState<string>(activeId || '')

  // 提取标题
  const headings = useMemo(() => {
    return extractHeadings(content).filter(heading => heading.level <= maxDepth)
  }, [content, maxDepth])

  // 监听滚动，高亮当前可见的标题
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            if (id && headings.some(h => h.id === id)) {
              setCurrentActiveId(id)
            }
          }
        })
      },
      {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0
      }
    )

    // 观察所有标题元素
    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  // 点击标题跳转
  const handleHeadingClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      setCurrentActiveId(id)
    }
  }

  if (headings.length === 0) {
    return null
  }

  return (
    <nav className={`table-of-contents border border-border rounded-sm p-4 bg-card ${className}`}>
      {showTitle && (
        <h4 className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-3">
          TABLE OF CONTENTS
        </h4>
      )}
      <div className="max-h-56 sm:max-h-64 lg:max-h-[34vh] overflow-y-auto pr-1">
        <ul className="space-y-1">
          {headings.map(({ level, text, id }) => (
            <li key={id}>
              <button
                onClick={() => handleHeadingClick(id)}
                className={`
                  block w-full text-left text-xs font-mono-display tracking-wide transition-colors duration-200 hover:text-primary
                  ${currentActiveId === id
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                  }
                `}
                style={{
                  paddingLeft: `${(level - 1) * 0.75}rem`,
                  paddingTop: '0.25rem',
                  paddingBottom: '0.25rem'
                }}
                title={text}
              >
                <span className="line-clamp-2 leading-tight">
                  {text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
})

TableOfContents.displayName = 'TableOfContents'
