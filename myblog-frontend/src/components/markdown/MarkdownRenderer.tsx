import React from 'react'
import ReactMarkdown from 'react-markdown'
import { markdownConfig } from '../../config/markdown'
import { generateHeadingSlug } from '../../utils/markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (children === null || children === undefined || typeof children === 'boolean') {
    return ''
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join('')
  }
  if (React.isValidElement(children)) {
    return extractTextFromChildren((children.props as { children?: React.ReactNode }).children)
  }
  return ''
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  const { remarkPlugins = [], rehypePlugins = [] } = markdownConfig

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          code: ({ node, className, children, ...props }) => {
            const isInline = !className?.includes('language-')
            
            if (isInline) {
              return (
                <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            
            return (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4">
                <code className="text-sm font-mono" {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          h1: ({ node, children, ...props }) => {
            const id = generateHeadingSlug(extractTextFromChildren(children))
            return (
              <h1 id={id || undefined} className="text-3xl font-bold mt-8 mb-4 text-foreground scroll-mt-20" {...props}>
                {children}
              </h1>
            )
          },
          h2: ({ node, children, ...props }) => {
            const id = generateHeadingSlug(extractTextFromChildren(children))
            return (
              <h2 id={id || undefined} className="text-2xl font-semibold mt-6 mb-3 text-foreground scroll-mt-20" {...props}>
                {children}
              </h2>
            )
          },
          h3: ({ node, children, ...props }) => {
            const id = generateHeadingSlug(extractTextFromChildren(children))
            return (
              <h3 id={id || undefined} className="text-xl font-medium mt-4 mb-2 text-foreground scroll-mt-20" {...props}>
                {children}
              </h3>
            )
          },
          h4: ({ node, children, ...props }) => {
            const id = generateHeadingSlug(extractTextFromChildren(children))
            return (
              <h4 id={id || undefined} className="text-lg font-medium mt-3 mb-2 text-foreground scroll-mt-20" {...props}>
                {children}
              </h4>
            )
          },
          p: ({ node, children, ...props }) => (
            <p className="mb-4 leading-relaxed text-foreground/90" {...props}>
              {children}
            </p>
          ),
          ul: ({ node, children, ...props }) => (
            <ul className="mb-4 ml-6 list-disc space-y-1 text-foreground/90" {...props}>
              {children}
            </ul>
          ),
          ol: ({ node, children, ...props }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-1 text-foreground/90" {...props}>
              {children}
            </ol>
          ),
          li: ({ node, children, ...props }) => (
            <li className="leading-relaxed" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ node, children, ...props }) => (
            <blockquote 
              className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 italic text-foreground/80" 
              {...props}
            >
              {children}
            </blockquote>
          ),
          a: ({ node, children, ...props }) => (
            <a 
              className="text-primary hover:underline underline-offset-4" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props}
            >
              {children}
            </a>
          ),
          img: ({ node, alt, src, ...props }) => {
            if (!src) return null

            return (
              <img
                src={src}
                alt={alt || 'Markdown image'}
                className="my-5 w-full rounded-sm border border-border/60 bg-muted/20 object-contain shadow-[0_18px_38px_hsl(var(--foreground)/0.08)]"
                loading="lazy"
                {...props}
              />
            )
          },
          table: ({ node, children, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border-collapse border border-border" {...props}>
                {children}
              </table>
            </div>
          ),
          th: ({ node, children, ...props }) => (
            <th 
              className="border border-border px-4 py-2 bg-muted font-semibold text-left" 
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ node, children, ...props }) => (
            <td 
              className="border border-border px-4 py-2 text-foreground/90" 
              {...props}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
