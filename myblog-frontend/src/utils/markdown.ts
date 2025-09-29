// Markdown相关工具函数

/**
 * 估算文章阅读时间
 * @param content Markdown内容
 * @param wordsPerMinute 每分钟阅读字数，默认200
 * @returns 阅读时间（分钟）
 */
export function estimateReadingTime(content: string, wordsPerMinute: number = 200): number {
  // 移除Markdown语法标记
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '') // 移除行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, '$1') // 移除粗体斜体标记
    .replace(/~~(.*?)~~/g, '$1') // 移除删除线
    .replace(/^\s*[-*+]\s/gm, '') // 移除列表标记
    .replace(/^\s*\d+\.\s/gm, '') // 移除有序列表标记
    .replace(/^\s*>\s/gm, '') // 移除引用标记
    .replace(/\n+/g, ' ') // 将换行符替换为空格
    .trim()

  // 计算字数（中英文混合）
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishWords = plainText.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length
  
  // 中文字符按1个字计算，英文单词按1个词计算
  const totalWords = chineseChars + englishWords
  
  const readingTime = Math.ceil(totalWords / wordsPerMinute)
  return Math.max(1, readingTime) // 至少1分钟
}

/**
 * 提取文章摘要
 * @param content Markdown内容
 * @param maxLength 最大长度，默认200字符
 * @returns 文章摘要
 */
export function extractSummary(content: string, maxLength: number = 200): string {
  // 移除Markdown语法标记，获取纯文本
  const plainText = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]*`/g, '') // 移除行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[.*?\]\(.*?\)/g, '') // 移除链接
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/[*_]{1,2}(.*?)[*_]{1,2}/g, '$1') // 移除粗体斜体标记
    .replace(/~~(.*?)~~/g, '$1') // 移除删除线
    .replace(/^\s*[-*+]\s/gm, '') // 移除列表标记
    .replace(/^\s*\d+\.\s/gm, '') // 移除有序列表标记
    .replace(/^\s*>\s/gm, '') // 移除引用标记
    .replace(/\n+/g, ' ') // 将换行符替换为空格
    .trim()

  if (plainText.length <= maxLength) {
    return plainText
  }

  // 截取指定长度，并在最后一个完整单词处截断
  let summary = plainText.substring(0, maxLength)
  const lastSpaceIndex = summary.lastIndexOf(' ')
  
  if (lastSpaceIndex > maxLength * 0.8) {
    summary = summary.substring(0, lastSpaceIndex)
  }
  
  return summary + '...'
}

/**
 * 提取文章中的标题列表（目录）
 * @param content Markdown内容
 * @returns 标题列表
 */
export function extractHeadings(content: string): Array<{
  level: number
  text: string
  id: string
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const headings: Array<{ level: number; text: string; id: string }> = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留字母、数字、中文、空格和连字符
      .replace(/\s+/g, '-') // 空格替换为连字符
      .replace(/-+/g, '-') // 多个连字符合并为一个
      .replace(/^-|-$/g, '') // 移除首尾连字符

    headings.push({ level, text, id })
  }

  return headings
}

/**
 * 为Markdown内容添加标题ID
 * @param content Markdown内容
 * @returns 添加了ID的Markdown内容
 */
export function addHeadingIds(content: string): string {
  return content.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
    const id = title
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    
    return `${hashes} ${title} {#${id}}`
  })
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      textArea.remove()
      return success
    }
  } catch (error) {
    console.error('复制到剪贴板失败:', error)
    return false
  }
}