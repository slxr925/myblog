// 博客相关的TypeScript类型定义

export interface BlogDetailVO {
  id: number
  title: string
  content: string
  summary: string
  coverImg?: string
  authorId: number
  authorName: string
  authorAvatar?: string
  categoryId?: number
  categoryName?: string
  tags: string[]
  status: number
  viewCount: number
  likeCount: number
  commentCount: number
  publishTime: string
  createTime: string
  updateTime: string
}

export interface BlogDetailEnhancedVO {
  blog: BlogDetailVO
  relatedBlogs: BlogDetailVO[]
  previousBlog?: BlogDetailVO
  nextBlog?: BlogDetailVO
  hotBlogs: BlogDetailVO[]
  latestBlogs: BlogDetailVO[]
  categoryBlogs: BlogDetailVO[]
}

export interface CommentVO {
  id: number
  blogId: number
  userId: number
  username: string
  userAvatar?: string
  content: string
  createTime: string
  updateTime: string
}

export interface CommentCreateDTO {
  blogId: number
  content: string
}

// 博客状态枚举
export enum BlogStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  OFFLINE = 2
}

// 用户角色枚举
export enum UserRole {
  USER = 0,
  ADMIN = 1
}