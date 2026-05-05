// API响应类型定义
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 响应拦截器处理后的类型（直接是data部分）
export type ProcessedResponse<T> = T;

// 分页请求参数
export interface PageParams {
  page?: number;
  size?: number;
  categoryId?: number;
  tagId?: number;
  keyword?: string;
  status?: number;
  sort?: BlogSortOption;
  timeRange?: BlogTimeRange;
}

// 分页响应数据
export interface PageResponse<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

// 点赞操作结果DTO
export interface LikeResultDTO {
  isLiked: boolean;
  likeCount: number;
  viewCount: number;
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
  blogCount?: number;
  createTime?: string;
  updateTime?: string;
  deleted?: number;
}

export interface Tag {
  id: number;
  name: string;
  color?: string;
  createTime?: string;
  updateTime?: string;
  deleted?: number;
}

// 博客详情VO
export interface BlogDetailVO {
  id: number;
  publicId?: string;
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
  visibility?: number;
  isTop: number;
  viewCount: number;
  likeCount: number;
  isLiked?: boolean; // Added isLiked field
  commentCount: number;
  publishTime?: string;
  createTime?: string;
  updateTime?: string;
  statusChangedTime?: string;
}

export interface BlogDocument {
  id: string;
  title: string;
  summary: string;
  content: string;
  coverImg?: string;
  authorId?: number;
  authorName?: string;
  categoryId?: number;
  categoryName?: string;
  tags?: string[];
  status?: number;
  isTop?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishTime?: string;
  createTime?: string;
  updateTime?: string;
}

export interface BlogListVO {
  id: number;
  publicId?: string;
  title: string;
  summary?: string;
  coverImage?: string;
  authorId?: number;
  authorNickname?: string;
  authorAvatar?: string;
  categoryId?: number;
  categoryName?: string;
  tags?: TagVO[];
  status?: number;
  visibility?: number;
  isTop?: boolean;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishTime?: string;
  createTime?: string;
  updateTime?: string;
  statusChangedTime?: string;
}

export interface PageResult<T> {
  // Spring Data Page style
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  // MyBatis Plus Page style
  records?: T[];
  total?: number;
  pages?: number;
  current?: number;
}

export interface BlogRecommendationVO {
  id: number;
  publicId?: string;
  title: string;
  categoryId?: number;
  categoryName?: string;
  publishTime?: string;
}

export type BlogSortOption = 'latest' | 'popular' | 'liked';
export type BlogTimeRange = 'all' | '30d' | '90d' | 'year';

export interface RecommendationSectionVO {
  title: string;
  source: 'related' | 'hot' | 'category' | 'latest';
  items: BlogRecommendationVO[];
}

export interface BlogLegacyRedirectVO {
  publicId: string;
}

// 博客详情增强VO
export interface BlogDetailEnhancedVO {
  blog: BlogDetailVO;
  relatedBlogs: BlogDetailVO[];
  previousBlog?: BlogDetailVO;
  nextBlog?: BlogDetailVO;
  hotBlogs: BlogDetailVO[];
  latestBlogs: BlogDetailVO[];
  relatedSection?: RecommendationSectionVO;
}

// 前端博客文章类型
export interface BlogPost {
  id: number;
  publicId?: string;
  title: string;
  excerpt: string;
  highlightedTitle?: string;
  highlightedExcerpt?: string;
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
  captchaId?: string;
  captchaCode?: string;
  role?: number;
}

// 用户登录DTO
export interface UserLoginDTO {
  username: string;
  password: string;
  captchaId?: string;
  captchaCode?: string;
}

// 用户认证状态
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Token响应
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn: number;
  refreshExpiresIn?: number;
  sessionId?: number;
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
  publicId?: string;
  userId: number;
  username: string;
  nickname?: string;  // 添加nickname字段
  userAvatar?: string;
  avatar?: string;
  parentId?: number;
  replyUserId?: number;
  replyUserNickname?: string;
  content: string;
  likeCount?: number;  // 添加点赞数
  isLiked?: boolean;   // 添加是否点赞
  replyCount?: number; // 添加回复数
  replies?: CommentVO[]; // 添加子评论列表
  createTime: string;
  updateTime: string;
}

// 评论创建DTO
export interface CommentCreateDTO {
  blogId: number;
  content: string;
  parentId?: number;  // 添加parentId字段，用于回复
  replyUserId?: number;
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

// ========== 收藏相关类型定义 ==========

// 收藏夹分类
export interface CollectionFolder {
  id: number;
  userId: number;
  name: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
  collectionCount: number;
  isPublic?: boolean;
  shareCode?: string;
  shareExpireTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 用户收藏
export interface UserCollection {
  id: number;
  userId: number;
  targetType: string;
  targetId: number;
  folderId: number;
  note?: string;
  createTime?: string;
  updateTime?: string;
}

// 收藏夹VO（包含收藏数量）
export interface CollectionFolderVO {
  id: number;
  userId?: number;
  name: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
  collectionCount: number;
  isPublic?: boolean;
  shareCode?: string;
  shareExpireTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 收藏记录VO（包含博客信息）
export interface UserCollectionVO {
  id: number;
  folderId: number;
  folderName: string;
  blogId: number;
  publicId?: string;
  blogTitle: string;
  blogSummary?: string;
  authorName: string;
  viewCount: number;
  blog?: BlogListVO;
  note?: string;
  createTime?: string;
  updateTime?: string;
}

// 收藏夹创建/更新DTO
export interface CollectionFolderDTO {
  name: string;
  description?: string;
  sortOrder?: number;
  isPublic?: boolean;
}

// 收藏操作DTO
export interface CollectToggleDTO {
  targetId: number;
  targetType: string;
  folderId?: number;
  note?: string;
}

// 收藏结果DTO
export interface CollectResultDTO {
  isCollected: boolean;
  message: string;
  folderId?: number;
}

// ========== 关注相关类型定义 ==========

// 用户关注关系VO
export interface UserFollowVO {
  userId: number;
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  followTime: string;
  isFollowing: boolean;
}

// 关注响应数据
export interface FollowPageResponse {
  records: UserFollowVO[];
  total: number;
  current: number;
  size: number;
  pages?: number;
}

// ========== 浏览记录相关类型定义 ==========

// 浏览记录VO
export interface BrowseHistoryVO {
  id: number;
  blogId: number;
  publicId?: string;
  title: string;
  summary: string;
  coverImg?: string;
  categoryName?: string;
  tags: string[];
  browseTime: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

// ========== 通知相关类型定义 ==========

// 通知类型枚举
export enum NotificationType {
  SYSTEM = 'SYSTEM',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  NEW_ARTICLE = 'NEW_ARTICLE',
  STATS = 'STATS',
  WEEKLY_DIGEST = 'WEEKLY_DIGEST'
}

// 通知状态枚举
export enum NotificationStatus {
  UNREAD = 0,
  READ = 1
}

// 通知VO
export interface NotificationVO {
  id: number;
  receiverId: number; // 后端是 receiverId
  type: string;       // 后端返回的是字符串类型
  title: string;
  content: string;
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  resourceId?: number;   // 修正为 resourceId
  resourceType?: string; // 修正为 resourceType
  extraData?: string | Record<string, any>; // 后端可能返回JSON字符串或Map
  status: NotificationStatus; // 这里后端返回的是 isRead (boolean)，或者 status
  isRead?: boolean; // 后端 NotificationVO 用 isRead
  createTime: string;
  // 方便前端使用的解析后的extraData
  parsedExtraData?: Record<string, any>;
}

// 通知设置
export interface NotificationSettingVO {
  userId: number;
  enableComment: boolean;
  enableLike: boolean;
  enableFollow: boolean;
  enableCollection?: boolean;
  enableSystem: boolean;
  enableNewArticle: boolean;
  enableMention?: boolean;
  enableStats?: boolean;
  enableWeeklyDigest: boolean;
  enableWebsocket: boolean;
  enableBrowser: boolean;
  enableAll: boolean;
}

// 用户会话
export interface UserSessionVO {
  sessionId: number;
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
  deviceInfo?: string;
  browser?: string;
  lastSeen?: string;
  createdAt?: string;
  status?: number;
}

// 举报
export interface ReportCreateDTO {
  targetType: string;
  targetId: number;
  reason?: string;
  detail?: string;
}

export interface ReportReviewDTO {
  status: number;
  action?: string;
  notes?: string;
}

export interface ReportVO {
  id: number;
  reporterId: number;
  reporterName?: string;
  targetType: string;
  targetId: number;
  reason?: string;
  detail?: string;
  status: number;
  reviewerId?: number;
  reviewerName?: string;
  reviewTime?: string;
  action?: string;
  notes?: string;
  createTime?: string;
}

// 博客版本
export interface BlogRevisionVO {
  id: number;
  blogId: number;
  version: number;
  title: string;
  summary?: string;
  authorId: number;
  createTime?: string;
}

export interface BlogRevisionDiffVO {
  fromRevisionId: number;
  toRevisionId: number;
  fromTitle?: string;
  toTitle?: string;
  fromSummary?: string;
  toSummary?: string;
  fromContentSnippet?: string;
  toContentSnippet?: string;
  titleChanged?: boolean;
  summaryChanged?: boolean;
  contentChanged?: boolean;
}

// 搜索热词
export interface SearchTrendVO {
  keyword: string;
  count: number;
}

// AI使用统计
export interface AiUsageDailyVO {
  date: string;
  requestCount: number;
  tokenCount: number;
}

export interface AiUsageUserVO {
  userId: number;
  username?: string;
  requestCount: number;
  tokenCount: number;
}

export interface OpenAiConfigVO {
  aiEnabled: boolean;
  apiKeyConfigured: boolean;
  apiKeyMasked: string;
  baseUrl: string;
  model: string;
  completionsPath: string;
  temperature: number;
  maxTokensChat: number;
  maxTokensTitle: number;
  maxTokensSummary: number;
  maxTokensKeywords: number;
  maxTokensPolish: number;
  available: boolean;
  envFileExists: boolean;
  envFilePath: string;
  lastModifiedAt?: string;
}

export interface OpenAiConfigUpdateDTO {
  aiEnabled?: boolean;
  apiKey?: string;
  clearApiKey?: boolean;
  baseUrl?: string;
  model?: string;
  completionsPath?: string;
  temperature?: number;
  maxTokensChat?: number;
  maxTokensTitle?: number;
  maxTokensSummary?: number;
  maxTokensKeywords?: number;
  maxTokensPolish?: number;
}

// 未读数量响应
export interface UnreadCountVO {
  total: number;
  system: number;
  comment: number;
  like: number;
  follow: number;
  mention: number;
}
