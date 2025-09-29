// Markdown渲染器配置

import { Options } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

// 简化的Markdown渲染配置，避免JSX语法问题
export const markdownConfig: Options = {
  remarkPlugins: [remarkGfm],
  rehypePlugins: [rehypeRaw, rehypeSanitize]
}

// 代码高亮主题配置
export const codeHighlightTheme = 'github'
export const darkCodeHighlightTheme = 'github-dark'

// 支持的编程语言列表
export const supportedLanguages = [
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'python',
  'java',
  'cpp',
  'c',
  'csharp',
  'php',
  'ruby',
  'go',
  'rust',
  'swift',
  'kotlin',
  'scala',
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'json',
  'xml',
  'yaml',
  'toml',
  'ini',
  'bash',
  'shell',
  'powershell',
  'sql',
  'markdown',
  'dockerfile',
  'nginx',
  'apache'
]