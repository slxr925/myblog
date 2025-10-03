// API响应类型定义
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 分页请求参数
export interface PageParams {
  page?: number;
  size?: number;
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  status?: number;
}

// 分页响应数据
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 标签VO
export interface TagVO {
  id: number;
  name: string;
  color?: string;
}

// 分类实体
export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  sort?: number;
  createTime?: string;
  updateTime?: string;
  deleted?: number;
}

// 博客详情VO
export interface BlogDetailVO {
  id: number;
  title: string;
  summary: string;
  content: string;
  coverImg?: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string;
  categoryId?: number;
  categoryName?: string;
  tags: TagVO[];
  status: number;
  isTop: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 博客详情增强VO
export interface BlogDetailEnhancedVO {
  blog: BlogDetailVO;
  relatedBlogs: BlogDetailVO[];
  previousBlog?: BlogDetailVO;
  nextBlog?: BlogDetailVO;
  hotBlogs: BlogDetailVO[];
  latestBlogs: BlogDetailVO[];
  categoryBlogs: BlogDetailVO[];
}

// 前端博客文章类型
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  image: string;
  featured: boolean;
  categoryId?: number;
  categoryName?: string;
}

// 用户实体
export interface User {
  id: number;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  status: number;
  role: number;
  createTime?: string;
  updateTime?: string;
}

// 用户注册DTO
export interface UserRegisterDTO {
  username: string;
  password: string;
  email: string;
  nickname?: string;
  role?: number;
}

// 用户登录DTO
export interface UserLoginDTO {
  username: string;
  password: string;
}

// 用户认证状态
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 用户角色枚举
export enum Role {
  USER = 0,
  ADMIN = 1
}

// 用户状态枚举
export enum UserStatus {
  NORMAL = 0,
  DISABLED = 1
}

// 评论VO
export interface CommentVO {
  id: number;
  blogId: number;
  userId: number;
  username: string;
  userAvatar?: string;
  content: string;
  createTime: string;
  updateTime: string;
}

// 评论创建DTO
export interface CommentCreateDTO {
  blogId: number;
  content: string;
}

// 博客状态枚举
export enum BlogStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  OFFLINE = 2
}

// 每日统计数据
export interface DailyStatsDTO {
  date: string;
  newUsers: number;
  newBlogs: number;
  newComments: number;
  totalViews: number;
}

// 管理员统计数据
export interface AdminStatsDTO {
  totalUsers: number;
  totalBlogs: number;
  totalComments: number;
  totalLikes: number;
  todayViews: number;
  todayNewUsers: number;
  todayNewBlogs: number;
  todayNewComments: number;
  weeklyStats: DailyStatsDTO[];
  monthlyStats: DailyStatsDTO[];
}