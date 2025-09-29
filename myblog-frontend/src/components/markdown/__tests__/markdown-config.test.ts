// Markdown配置测试

import { describe, it, expect } from 'vitest'
import { markdownConfig, supportedLanguages } from '../../../config/markdown'
import { estimateReadingTime, extractSummary, extractHeadings } from '../../../utils/markdown'

describe('Markdown Configuration', () => {
  it('should have valid markdown config', () => {
    expect(markdownConfig).toBeDefined()
    expect(markdownConfig.remarkPlugins).toBeDefined()
    expect(markdownConfig.rehypePlugins).toBeDefined()
    // components 字段是可选的，所以不需要检查
  })

  it('should have supported languages list', () => {
    expect(supportedLanguages).toBeDefined()
    expect(Array.isArray(supportedLanguages)).toBe(true)
    expect(supportedLanguages.length).toBeGreaterThan(0)
    expect(supportedLanguages).toContain('javascript')
    expect(supportedLanguages).toContain('typescript')
    expect(supportedLanguages).toContain('python')
  })
})

describe('Markdown Utils', () => {
  const sampleMarkdown = `
# 标题一

这是一段测试文本，用于测试阅读时间估算功能。

## 标题二

这里有一些代码：

\`\`\`javascript
function hello() {
  console.log('Hello World!')
}
\`\`\`

### 标题三

这是另一段文本，包含**粗体**和*斜体*文字。

- 列表项1
- 列表项2
- 列表项3

> 这是一个引用块

[链接文本](https://example.com)

![图片](https://example.com/image.jpg)
  `.trim()

  describe('estimateReadingTime', () => {
    it('should estimate reading time correctly', () => {
      const readingTime = estimateReadingTime(sampleMarkdown)
      expect(readingTime).toBeGreaterThan(0)
      expect(typeof readingTime).toBe('number')
    })

    it('should return at least 1 minute for short content', () => {
      const shortContent = '短文本'
      const readingTime = estimateReadingTime(shortContent)
      expect(readingTime).toBe(1)
    })

    it('should handle empty content', () => {
      const readingTime = estimateReadingTime('')
      expect(readingTime).toBe(1)
    })
  })

  describe('extractSummary', () => {
    it('should extract summary correctly', () => {
      const summary = extractSummary(sampleMarkdown, 50)
      expect(summary).toBeDefined()
      expect(typeof summary).toBe('string')
      expect(summary.length).toBeLessThanOrEqual(53) // 50 + '...'
      expect(summary).not.toContain('#')
      expect(summary).not.toContain('```')
      expect(summary).not.toContain('**')
    })

    it('should return full content if shorter than maxLength', () => {
      const shortContent = '短文本'
      const summary = extractSummary(shortContent, 100)
      expect(summary).toBe(shortContent)
    })

    it('should handle empty content', () => {
      const summary = extractSummary('')
      expect(summary).toBe('')
    })
  })

  describe('extractHeadings', () => {
    it('should extract headings correctly', () => {
      const headings = extractHeadings(sampleMarkdown)
      expect(headings).toBeDefined()
      expect(Array.isArray(headings)).toBe(true)
      expect(headings.length).toBe(3)
      
      expect(headings[0]).toEqual({
        level: 1,
        text: '标题一',
        id: '标题一'
      })
      
      expect(headings[1]).toEqual({
        level: 2,
        text: '标题二',
        id: '标题二'
      })
      
      expect(headings[2]).toEqual({
        level: 3,
        text: '标题三',
        id: '标题三'
      })
    })

    it('should handle content without headings', () => {
      const contentWithoutHeadings = '这是没有标题的内容'
      const headings = extractHeadings(contentWithoutHeadings)
      expect(headings).toEqual([])
    })

    it('should generate valid IDs for English headings', () => {
      const englishMarkdown = '# Hello World\n## Test Heading'
      const headings = extractHeadings(englishMarkdown)
      expect(headings[0].id).toBe('hello-world')
      expect(headings[1].id).toBe('test-heading')
    })
  })
})