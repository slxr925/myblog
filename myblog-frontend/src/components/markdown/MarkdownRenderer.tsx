import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// @ts-ignore
import { github, githubDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { markdownConfig, supportedLanguages } from '../../config/markdown'
import { copyToClipboard } from '../../utils/markdown'
// import '../../styles/markdown.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  theme?: 'light' | 'dark' | 'auto'
  showLineNumbers?: boolean
  enableCopy?: boolean
}

interface CodeBlockProps {
  children: string
  className?: string
  inline?: boolean
  theme: 'light' | 'dark'
  showLineNumbers: boolean
  enableCopy: boolean
}

const CodeBlock: React.FC<CodeBlockProps> = memo(({ 
  children, 
  className, 
  inline, 
  theme, 
  showLineNumbers, 
  enableCopy 
}) => {
  const [copied, setCopied] = React.useState(false)
  
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  
  const handleCopy = async () => {
    const success = await copyToClipboard(children)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 行内代码
  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    )
  }

  // 代码块
  if (language && supportedLanguages.includes(language)) {
    return (
      <div className="relative syntax-highlighter">
        {enableCopy && (
          <button
            onClick={handleCopy}
            className="code-copy-button"
            title={copied ? '已复制' : '复制代码'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
        <SyntaxHighlighter
          style={theme === 'dark' ? githubDark : github}
          language={language}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    )
  }

  // 普通代码块（无语言标识）
  return (
    <div className="relative">
      {enableCopy && (
        <button
          onClick={handleCopy}
          className="code-copy-button"
          title={copied ? '已复制' : '复制代码'}
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto border border-gray-200 dark:border-gray-700">
        <code className="text-sm font-mono">{children}</code>
      </pre>
    </div>
  )
})

CodeBlock.displayName = 'CodeBlock'

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({
  content,
  className = '',
  theme = 'auto',
  showLineNumbers = false,
  enableCopy = true
}) => {
  // 根据系统主题自动选择代码高亮主题
  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }, [theme])

  // 自定义组件配置
  const components = useMemo(() => ({
    ...markdownConfig.components,
    code: ({ children, className, inline, ...props }: any) => (
      <CodeBlock
        children={String(children).replace(/\n$/, '')}
        className={className}
        inline={inline}
        theme={resolvedTheme}
        showLineNumbers={showLineNumbers}
        enableCopy={enableCopy}
        {...props}
      />
    ),
    // 自定义标题组件，添加锚点链接
    h1: ({ children, ...props }: any) => {
      const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-')
      return (
        <h1 
          id={id}
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 first:mt-0 scroll-mt-20"
          {...props}
        >
          {children}
        </h1>
      )
    },
    h2: ({ children, ...props }: any) => {
      const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-')
      return (
        <h2 
          id={id}
          className="text-2xl font-semibold text-foreground mb-4 mt-6 scroll-mt-20"
          {...props}
        >
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }: any) => {
      const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-')
      return (
        <h3 
          id={id}
          className="text-xl font-semibold text-foreground mb-3 mt-5 scroll-mt-20"
          {...props}
        >
          {children}
        </h3>
      )
    },
    h4: ({ children, ...props }: any) => {
      const id = String(children).toLowerCase().replace(/[^\w\u4e00-\u9fa5\s-]/g, '').replace(/\s+/g, '-')
      return (
        <h4 
          id={id}
          className="text-lg font-medium text-foreground mb-2 mt-4 scroll-mt-20"
          {...props}
        >
          {children}
        </h4>
      )
    },
    // 自定义段落组件
    p: ({ children, ...props }: any) => (
      <p className="text-foreground leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    // 自定义引用组件
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r italic"
        {...props}
      >
        {children}
      </blockquote>
    ),
    // 自定义列表组件
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-foreground" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),
    // 自定义链接组件
    a: ({ href, children, ...props }: any) => (
      <a 
        href={href}
        className="text-primary hover:text-primary/80 underline transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    ),
    // 自定义图片组件
    img: ({ src, alt, ...props }: any) => (
      <img 
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-sm my-4 mx-auto block"
        loading="lazy"
        {...props}
      />
    ),
    // 自定义表格组件
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-border" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="border border-border px-4 py-2" {...props}>
        {children}
      </td>
    ),
    // 自定义分割线组件
    hr: ({ ...props }: any) => (
      <hr className="border-border my-8" {...props} />
    )
  }), [resolvedTheme, showLineNumbers, enableCopy])

  return (
    <div className={`markdown-content prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={markdownConfig.remarkPlugins}
        rehypePlugins={markdownConfig.rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})

MarkdownRenderer.displayName = 'MarkdownRenderer'