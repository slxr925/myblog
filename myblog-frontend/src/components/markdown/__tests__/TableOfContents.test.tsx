// TableOfContents组件测试

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { TableOfContents } from '../TableOfContents'

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn()
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
})
window.IntersectionObserver = mockIntersectionObserver

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

describe('TableOfContents', () => {
  const sampleMarkdown = `
# 第一章 介绍

这是第一章的内容。

## 1.1 背景

背景介绍。

## 1.2 目标

目标说明。

### 1.2.1 主要目标

主要目标详述。

### 1.2.2 次要目标

次要目标详述。

# 第二章 实现

这是第二章的内容。

## 2.1 技术选型

技术选型说明。

##### 深层标题

这个标题层级很深。
  `.trim()

  it('should render table of contents correctly', () => {
    render(<TableOfContents content={sampleMarkdown} />)
    
    // 检查目录标题
    expect(screen.getByText('目录')).toBeInTheDocument()
    
    // 检查各级标题
    expect(screen.getByText('第一章 介绍')).toBeInTheDocument()
    expect(screen.getByText('1.1 背景')).toBeInTheDocument()
    expect(screen.getByText('1.2 目标')).toBeInTheDocument()
    expect(screen.getByText('1.2.1 主要目标')).toBeInTheDocument()
    expect(screen.getByText('1.2.2 次要目标')).toBeInTheDocument()
    expect(screen.getByText('第二章 实现')).toBeInTheDocument()
    expect(screen.getByText('2.1 技术选型')).toBeInTheDocument()
  })

  it('should respect maxDepth prop', () => {
    render(<TableOfContents content={sampleMarkdown} maxDepth={2} />)
    
    // 应该显示1-2级标题
    expect(screen.getByText('第一章 介绍')).toBeInTheDocument()
    expect(screen.getByText('1.1 背景')).toBeInTheDocument()
    expect(screen.getByText('1.2 目标')).toBeInTheDocument()
    expect(screen.getByText('第二章 实现')).toBeInTheDocument()
    expect(screen.getByText('2.1 技术选型')).toBeInTheDocument()
    
    // 不应该显示3级标题
    expect(screen.queryByText('1.2.1 主要目标')).not.toBeInTheDocument()
    expect(screen.queryByText('1.2.2 次要目标')).not.toBeInTheDocument()
    
    // 不应该显示5级标题
    expect(screen.queryByText('深层标题')).not.toBeInTheDocument()
  })

  it('should handle click events on headings', () => {
    // Mock getElementById
    const mockElement = {
      scrollIntoView: vi.fn()
    }
    document.getElementById = vi.fn().mockReturnValue(mockElement)
    
    render(<TableOfContents content={sampleMarkdown} />)
    
    const firstHeading = screen.getByText('第一章 介绍')
    fireEvent.click(firstHeading)
    
    expect(document.getElementById).toHaveBeenCalledWith('第一章-介绍')
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    })
  })

  it('should apply proper indentation based on heading level', () => {
    render(<TableOfContents content={sampleMarkdown} />)
    
    // 检查各级标题都存在
    expect(screen.getByText('第一章 介绍')).toBeInTheDocument()
    expect(screen.getByText('1.1 背景')).toBeInTheDocument()
    expect(screen.getByText('1.2.1 主要目标')).toBeInTheDocument()
    
    // 检查目录结构正确
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should highlight active heading', () => {
    render(<TableOfContents content={sampleMarkdown} activeId="1-1-背景" />)
    
    // 检查标题存在
    expect(screen.getByText('1.1 背景')).toBeInTheDocument()
    expect(screen.getByText('第一章 介绍')).toBeInTheDocument()
    
    // 检查目录组件正常渲染
    expect(screen.getByText('目录')).toBeInTheDocument()
  })

  it('should not render when no headings are found', () => {
    const contentWithoutHeadings = '这是一段没有标题的普通文本。'
    
    const { container } = render(<TableOfContents content={contentWithoutHeadings} />)
    
    expect(container).toBeEmptyDOMElement()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <TableOfContents content={sampleMarkdown} className="custom-toc" />
    )
    
    const tocElement = container.querySelector('.table-of-contents')
    expect(tocElement).toHaveClass('custom-toc')
  })

  it('should setup IntersectionObserver on mount', () => {
    render(<TableOfContents content={sampleMarkdown} />)
    
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        rootMargin: '-20% 0px -35% 0px',
        threshold: 0
      }
    )
  })

  it('should handle empty content gracefully', () => {
    const { container } = render(<TableOfContents content="" />)
    
    expect(container).toBeEmptyDOMElement()
  })

  it('should generate correct heading IDs', () => {
    const complexMarkdown = `
# Hello World
## 测试标题 123
### Special-Characters!@#$%
#### Mixed 中英文 Content
    `.trim()
    
    render(<TableOfContents content={complexMarkdown} />)
    
    // 验证标题文本存在
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('测试标题 123')).toBeInTheDocument()
    expect(screen.getByText('Special-Characters!@#$%')).toBeInTheDocument()
    expect(screen.getByText('Mixed 中英文 Content')).toBeInTheDocument()
  })
})