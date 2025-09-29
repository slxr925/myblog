// MarkdownRenderer组件测试

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MarkdownRenderer } from '../MarkdownRenderer'

// Mock react-syntax-highlighter
vi.mock('react-syntax-highlighter', () => ({
  Prism: ({ children, ...props }: any) => (
    <pre data-testid="syntax-highlighter" {...props}>
      <code>{children}</code>
    </pre>
  )
}))

vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  github: {},
  githubDark: {}
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Copy: () => <span data-testid="copy-icon">Copy</span>,
  Check: () => <span data-testid="check-icon">Check</span>
}))

describe('MarkdownRenderer', () => {
  const sampleMarkdown = `
# 标题一

这是一段普通文本。

## 标题二

这里有一些**粗体**和*斜体*文字。

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello World!')
}
\`\`\`

行内代码：\`const x = 1\`

> 这是一个引用块

- 列表项1
- 列表项2
- 列表项3

[链接文本](https://example.com)
  `.trim()

  it('should render markdown content correctly', () => {
    render(<MarkdownRenderer content={sampleMarkdown} />)
    
    // 检查标题
    expect(screen.getByText('标题一')).toBeInTheDocument()
    expect(screen.getByText('标题二')).toBeInTheDocument()
    
    // 检查普通文本
    expect(screen.getByText('这是一段普通文本。')).toBeInTheDocument()
    
    // 检查列表
    expect(screen.getByText('列表项1')).toBeInTheDocument()
    expect(screen.getByText('列表项2')).toBeInTheDocument()
    expect(screen.getByText('列表项3')).toBeInTheDocument()
    
    // 检查链接
    const link = screen.getByText('链接文本')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com')
    expect(link.closest('a')).toHaveAttribute('target', '_blank')
  })

  it('should render code blocks with syntax highlighting', () => {
    const codeMarkdown = `
\`\`\`javascript
console.log('test')
\`\`\`
    `.trim()
    
    render(<MarkdownRenderer content={codeMarkdown} />)
    
    // 检查代码块是否渲染
    expect(screen.getByTestId('syntax-highlighter')).toBeInTheDocument()
    // 检查代码内容存在
    expect(screen.getByText("console.log('test')")).toBeInTheDocument()
  })

  it('should render inline code correctly', () => {
    const inlineCodeMarkdown = '这里有行内代码：`const x = 1`'
    
    render(<MarkdownRenderer content={inlineCodeMarkdown} />)
    
    const inlineCode = screen.getByText('const x = 1')
    expect(inlineCode).toBeInTheDocument()
    // 检查是否为code元素
    expect(inlineCode.tagName).toBe('CODE')
  })

  it('should add proper CSS classes to elements', () => {
    render(<MarkdownRenderer content="# 标题" />)
    
    const heading = screen.getByText('标题')
    expect(heading).toHaveClass('text-3xl', 'font-bold')
    expect(heading.tagName).toBe('H1')
  })

  it('should generate heading IDs for anchor links', () => {
    render(<MarkdownRenderer content="# 测试标题" />)
    
    const heading1 = screen.getByText('测试标题')
    expect(heading1).toHaveAttribute('id')
    expect(heading1.tagName).toBe('H1')
  })

  it('should handle copy functionality when enabled', () => {
    const codeMarkdown = `
\`\`\`javascript
console.log('test')
\`\`\`
    `.trim()
    
    render(<MarkdownRenderer content={codeMarkdown} enableCopy={true} />)
    
    const copyButton = screen.getByTitle('复制代码')
    expect(copyButton).toBeInTheDocument()
    
    // 只验证复制按钮存在，不测试实际复制功能
    expect(copyButton.tagName).toBe('BUTTON')
  })

  it('should not show copy button when disabled', () => {
    const codeMarkdown = `
\`\`\`javascript
console.log('test')
\`\`\`
    `.trim()
    
    render(<MarkdownRenderer content={codeMarkdown} enableCopy={false} />)
    
    expect(screen.queryByTitle('复制代码')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="# 标题" className="custom-class" />
    )
    
    const markdownContainer = container.querySelector('.markdown-content')
    expect(markdownContainer).toHaveClass('custom-class')
  })

  it('should handle empty content', () => {
    const { container } = render(<MarkdownRenderer content="" />)
    
    const markdownContainer = container.querySelector('.markdown-content')
    expect(markdownContainer).toBeInTheDocument()
  })

  it('should render blockquotes correctly', () => {
    const blockquoteMarkdown = '> 这是一个引用块'
    
    render(<MarkdownRenderer content={blockquoteMarkdown} />)
    
    const blockquote = screen.getByText('这是一个引用块').closest('blockquote')
    expect(blockquote).toHaveClass('border-l-4', 'border-primary', 'pl-4', 'py-2', 'my-4', 'bg-muted/50', 'rounded-r', 'italic')
  })

  it('should render tables correctly', () => {
    const tableMarkdown = `
| 列1 | 列2 |
|-----|-----|
| 数据1 | 数据2 |
    `.trim()
    
    render(<MarkdownRenderer content={tableMarkdown} />)
    
    expect(screen.getByText('列1')).toBeInTheDocument()
    expect(screen.getByText('列2')).toBeInTheDocument()
    expect(screen.getByText('数据1')).toBeInTheDocument()
    expect(screen.getByText('数据2')).toBeInTheDocument()
    
    const table = screen.getByRole('table')
    expect(table).toHaveClass('min-w-full', 'border-collapse', 'border', 'border-border')
  })
})