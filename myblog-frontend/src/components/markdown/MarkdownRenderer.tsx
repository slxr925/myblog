import React from 'react'
import ReactMarkdown from 'react-markdown'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
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
          h1: ({ node, children, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="text-xl font-medium mt-4 mb-2 text-foreground" {...props}>
              {children}
            </h3>
          ),
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