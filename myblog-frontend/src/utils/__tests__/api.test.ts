// API接口测试

import { describe, it, expect, beforeEach } from 'vitest'
import type { BlogDetailVO, CommentVO, CommentCreateDTO, ApiResponse } from '../../types/api'

describe('API Type Definitions', () => {
  it('should have correct BlogDetailVO structure', () => {
    const mockBlogDetailVO: BlogDetailVO = {
      id: 1,
      title: '测试博客',
      summary: '测试摘要',
      content: '测试内容',
      authorId: 1,
      authorName: '测试作者',
      tags: [{ id: 1, name: 'JavaScript' }],
      status: 1,
      isTop: 0,
      viewCount: 100,
      likeCount: 10,
      commentCount: 5,
      publishTime: '2024-01-01T00:00:00Z',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z'
    }

    expect(mockBlogDetailVO.id).toBe(1)
    expect(mockBlogDetailVO.title).toBe('测试博客')
    expect(mockBlogDetailVO.tags).toHaveLength(1)
    expect(mockBlogDetailVO.tags[0].name).toBe('JavaScript')
  })

  it('should have correct CommentVO structure', () => {
    const mockCommentVO: CommentVO = {
      id: 1,
      blogId: 1,
      userId: 1,
      username: '测试用户',
      content: '测试评论内容',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z'
    }

    expect(mockCommentVO.id).toBe(1)
    expect(mockCommentVO.blogId).toBe(1)
    expect(mockCommentVO.username).toBe('测试用户')
    expect(mockCommentVO.content).toBe('测试评论内容')
  })

  it('should have correct CommentCreateDTO structure', () => {
    const commentData: CommentCreateDTO = {
      blogId: 1,
      content: '新评论内容'
    }

    expect(commentData.blogId).toBe(1)
    expect(commentData.content).toBe('新评论内容')
  })

  it('should have correct ApiResponse structure', () => {
    const mockApiResponse: ApiResponse<string> = {
      code: 200,
      message: 'success',
      data: 'test data'
    }

    expect(mockApiResponse.code).toBe(200)
    expect(mockApiResponse.message).toBe('success')
    expect(mockApiResponse.data).toBe('test data')
  })
})

describe('Local Storage Auth Methods', () => {
  beforeEach(() => {
    // 清除localStorage
    localStorage.clear()
  })

  it('should save and retrieve auth info from localStorage', () => {
    const token = 'test-token'
    const user = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      status: 0,
      role: 0
    }
    
    // 模拟保存认证信息
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    // 验证保存成功
    expect(localStorage.getItem('token')).toBe(token)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user))
  })

  it('should clear auth info from localStorage', () => {
    localStorage.setItem('token', 'test-token')
    localStorage.setItem('user', '{"id":1}')
    
    // 清除认证信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('should check authentication status from localStorage', () => {
    // 未登录状态
    expect(localStorage.getItem('token')).toBeNull()
    
    // 已登录状态
    localStorage.setItem('token', 'test-token')
    expect(localStorage.getItem('token')).toBe('test-token')
  })
})