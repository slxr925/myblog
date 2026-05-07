import axios from 'axios';
import type {
  ApiResponse,
  ProcessedResponse,
  PageParams,
  PageResponse,
  PageResult,
  BlogDetailVO,
  BlogDetailEnhancedVO,
  BlogLegacyRedirectVO,
  BlogListVO,
  Category,
  TagVO,
  Tag,
  BlogPost,
  User,
  UserRegisterDTO,
  UserLoginDTO,
  AuthState,
  TokenResponse,
  CommentVO,
  CommentCreateDTO,
  AdminStatsDTO,
  LikeResultDTO,
  CollectionFolderVO,
  CollectionFolderDTO,
  CollectToggleDTO,
  CollectResultDTO,
  UserCollectionVO,
  FollowPageResponse,
  BrowseHistoryVO,
  NotificationVO,
  NotificationSettingVO,
  UnreadCountVO,
  NotificationType,
  UserSessionVO,
  ReportCreateDTO,
  ReportReviewDTO,
  ReportVO,
  SearchTrendVO,
  BlogRevisionVO,
  BlogRevisionDiffVO,
  AiUsageDailyVO,
  AiUsageUserVO,
  OpenAiConfigUpdateDTO,
  OpenAiConfigVO
} from '../types/api';

// 创建axios实例
// 根据环境自动选择API地址
export const getBaseURL = () => {
  // 开发环境直接访问后端
  if (import.meta.env.DEV) {
    return 'http://localhost:8081/api';
  }
  // 生产环境使用相对路径，通过Nginx反向代理
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshPromise: Promise<string | undefined> | null = null;

type ApiError = Error & {
  status?: number;
  isRateLimitError?: boolean;
  originalError?: unknown;
  isAuthError?: boolean;
};

type AiStreamEventName = 'status' | 'delta' | 'relatedArticles' | 'done' | 'error';

export interface AiChatStreamHandlers {
  onStatus?: (message: string) => void;
  onDelta?: (text: string) => void;
  onRelatedArticles?: (items: any[]) => void;
  onDone?: (data: any) => void;
  onError?: (message: string) => void;
}

const refreshAccessToken = async (): Promise<TokenResponse> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  return apiClient.post('/auth/refresh', null, {
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  }) as Promise<TokenResponse>;
};

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加token等认证信息
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 如果后端返回统一格式 {code, message, data}，则提取data部分
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      // 检查响应是否成功
      if (response.data.code === 200 || response.data.code === 0) {
        // 对于void类型的响应,data可能为null,返回整个response.data以保留message
        return response.data.data !== undefined ? response.data.data : response.data;
      } else {
        // 如果code不是成功码,抛出错误
        return Promise.reject(new Error(response.data.message || '请求失败'));
      }
    }

    return response;
  },
  (error) => {
    console.error('API响应错误:', error.config?.url, error.response?.status, error.message);

    if (error.response?.status === 401) {
      // 只在登录或注册接口之外的401错误才清除认证信息
      const isAuthEndpoint = error.config?.url?.includes('/login') || error.config?.url?.includes('/register');
      const isTrackVisit = error.config?.url?.includes('/track-visit');
      const isRefreshEndpoint = error.config?.url?.includes('/auth/refresh');

      // 尝试使用refresh token静默刷新
      if (!isAuthEndpoint && !isTrackVisit && !isRefreshEndpoint && localStorage.getItem('refreshToken')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshPromise = refreshAccessToken()
            .then((tokenResponse) => {
              const accessToken = tokenResponse.accessToken;
              const newRefreshToken = tokenResponse.refreshToken;
              if (accessToken) {
                localStorage.setItem('token', accessToken);
              }
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }
              isRefreshing = false;
              refreshPromise = null;
              return accessToken;
            })
            .catch((refreshError) => {
              isRefreshing = false;
              refreshPromise = null;
              throw refreshError;
            });
        }

        const activeRefresh = refreshPromise;
        if (!activeRefresh) {
          return Promise.reject(error);
        }
        return activeRefresh
          .then((accessToken) => {
            if (accessToken && error.config) {
              error.config.headers = error.config.headers || {};
              error.config.headers.Authorization = `Bearer ${accessToken}`;
              return apiClient.request(error.config);
            }
            return Promise.reject(error);
          })
          .catch(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.dispatchEvent(new CustomEvent('auth:expired', {
              detail: { message: '登录已过期，请重新登录', originalError: error }
            }));
            return Promise.reject(error);
          });
      }

      // 如果不是登录/注册接口,且不是访问统计接口,才清除token
      if (!isAuthEndpoint && !isTrackVisit && localStorage.getItem('token')) {
        // 清除认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');

        // 区分不同类型的401错误
        const errorMessage = error.response?.data?.message || '';
        let friendlyMessage = '您的登录已过期，请重新登录';

        if (errorMessage.includes('invalid') || errorMessage.includes('无效')) {
          friendlyMessage = '登录信息无效，请重新登录';
        } else if (errorMessage.includes('expired') || errorMessage.includes('过期')) {
          friendlyMessage = '登录已过期，请重新登录';
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('未授权')) {
          friendlyMessage = '您没有权限访问此资源，请重新登录';
        }

        // 不直接跳转，而是触发一个自定义事件
        window.dispatchEvent(new CustomEvent('auth:expired', {
          detail: { message: friendlyMessage, originalError: error }
        }));
      }
    }

    // 处理429限流错误
    if (error.response?.status === 429) {
      const limitMessage = error.response?.data?.message || '请求过于频繁，请稍后再试';
      console.warn('请求被限流:', error.config?.url, limitMessage);

      // 返回带429标识的错误，让调用方能识别并特殊处理
      const rateLimitError = new Error(limitMessage) as ApiError;
      rateLimitError.status = 429;
      rateLimitError.isRateLimitError = true;
      rateLimitError.originalError = error;

      return Promise.reject(rateLimitError);
    }

    // 为其他错误也添加友好的错误提示
    let errorMessage = '网络错误，请稍后重试';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请检查网络连接';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络';
      }
    }

    // 返回增强的错误对象
    const enhancedError = new Error(errorMessage) as ApiError;
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.isAuthError = error.response?.status === 401;

    return Promise.reject(enhancedError);
  }
);

// 工具函数：将后端BlogDetailVO转换为前端BlogPost
export const transformBlogDetailVOToBlogPost = (blog: BlogDetailVO): BlogPost => {

  // 处理日期格式：后端返回的可能是字符串格式 "2025-10-02T22:14:38" 或数组格式 [2025,10,2,22,14,38]
  let publishDate = '';
  try {
    if (blog.publishTime) {
      let dateObj: Date;
      if (Array.isArray(blog.publishTime)) {
        // 处理数组格式: [2025,10,2,22,14,38]
        const [year, month, day, hour, minute, second] = blog.publishTime;
        dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
      } else {
        // 处理字符串格式
        dateObj = new Date(blog.publishTime);
      }
      publishDate = dateObj.toLocaleDateString('zh-CN');
    }
  } catch (error) {
    console.error('日期转换错误:', error, 'publishTime:', blog.publishTime);
    publishDate = '未知日期';
  }

  // 处理标签
  const tags = blog.tags ? blog.tags.map(tag => {
    if (typeof tag === 'string') {
      return tag;
    } else if (tag && typeof tag === 'object' && 'name' in tag) {
      return tag.name;
    }
    return '';
  }).filter(tag => tag) : [];

  const transformedPost = {
    id: blog.id,
    publicId: blog.publicId,
    title: blog.title,
    excerpt: blog.summary || '',
    content: blog.content || '',
    author: blog.authorName || '未知作者',
    date: publishDate,
    readTime: `${Math.ceil((blog.content?.length || 0) / 500)}分钟`, // 简单估算阅读时间
    views: blog.viewCount || 0,
    likes: blog.likeCount || 0,
    comments: blog.commentCount || 0,
    tags: tags,
    image: blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
    featured: blog.isTop === 1,
    categoryId: blog.categoryId,
    categoryName: blog.categoryName,
  };

  return transformedPost;
};

const normalizeArrayResponse = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === 'object') {
    const responseObject = payload as Record<string, unknown>;
    if (Array.isArray(responseObject.data)) {
      return responseObject.data as T[];
    }
    if (Array.isArray(responseObject.records)) {
      return responseObject.records as T[];
    }
  }

  return [];
};

type SearchRequestOptions = {
  track?: boolean;
  source?: 'result' | 'suggest';
};

// API 请求工具
export const api = {
  blog: {
    // 分页获取博客列表
    getPage: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/page', { params });
    },

    // 获取博客详情
    getDetail: async (publicId: string): Promise<BlogDetailVO> => {
      return apiClient.get(`/blog/public/${publicId}`) as Promise<BlogDetailVO>;
    },

    // 根据ID获取博客（用于编辑器）
    getById: async (id: number): Promise<BlogDetailVO> => {
      return apiClient.get(`/blog/${id}`) as Promise<BlogDetailVO>;
    },

    // 获取增强版博客详情
    getDetailEnhanced: async (publicId: string): Promise<BlogDetailEnhancedVO> => {
      return apiClient.get(`/blog/public/${publicId}/enhanced`) as Promise<BlogDetailEnhancedVO>;
    },

    // 获取热门博客
    getHot: async (limit = 10): Promise<ProcessedResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/hot', { params: { limit } });
    },

    // 获取最新博客
    getLatest: async (limit = 10): Promise<ProcessedResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/latest', { params: { limit } });
    },

    // 获取推荐博客
    getRecommended: async (limit = 10): Promise<ProcessedResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/recommend', { params: { limit } });
    },

    // 根据分类获取博客
    getByCategory: async (categoryId: number, limit = 10): Promise<BlogDetailVO[]> => {
      return apiClient.get(`/blog/category/${categoryId}`, { params: { limit } }) as Promise<BlogDetailVO[]>;
    },

    // 根据分类获取公开文章（带错误处理）
    getByCategoryPublic: async (categoryId: number, limit = 10): Promise<BlogDetailVO[]> => {
      try {
        const response = await apiClient.get(`/blog/category/${categoryId}`, { params: { limit } });
        return normalizeArrayResponse<BlogDetailVO>(response);
      } catch (error) {
        console.error('根据分类获取文章失败:', error);
        return [];
      }
    },

    // 根据标签搜索文章
    searchByTag: async (tagName: string, limit = 10): Promise<BlogListVO[]> => {
      try {
        const response = await apiClient.get('/blog/search/by-tag', {
          params: { tagName, limit }
        });
        return normalizeArrayResponse<BlogListVO>(response);
      } catch (error) {
        console.error('根据标签搜索文章失败:', error);
        return [];
      }
    },

    // 获取相关推荐博客
    getRelated: async (id: number, limit = 5): Promise<BlogDetailVO[]> => {
      return apiClient.get(`/blog/${id}/related`, { params: { limit } }) as Promise<BlogDetailVO[]>;
    },

    // 点赞/取消点赞
    toggleLike: async (id: number): Promise<boolean> => {
      return apiClient.post(`/blog/${id}/like`) as Promise<boolean>;
    },
    // 点赞/取消点赞（返回详细信息）
    toggleLikeWithDetails: async (id: number): Promise<LikeResultDTO> => {
      return apiClient.post(`/blog/${id}/like/details`) as Promise<LikeResultDTO>;
    },
    // 获取博客详情（不增加浏览量）
    getDetailWithoutIncrement: async (id: number): Promise<BlogDetailVO> => {
      return apiClient.get(`/blog/${id}/detail`) as Promise<BlogDetailVO>;
    },

    // 将旧数字链接解析为公开UUID链接
    resolveLegacyRedirect: async (id: number): Promise<BlogLegacyRedirectVO> => {
      return apiClient.get(`/blog/legacy/${id}/redirect`) as Promise<BlogLegacyRedirectVO>;
    },

    // 获取当前作者的草稿列表
    getDrafts: async (): Promise<BlogDetailVO[]> => {
      return apiClient.get('/blog/drafts') as Promise<BlogDetailVO[]>;
    },

    // 获取当前作者的文章列表（可选状态）
    getMyBlogs: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/my', { params });
    },

    // 获取前端格式的博客列表
    getBlogList: async (params?: PageParams): Promise<{ posts: BlogPost[]; total: number }> => {
      try {
        const response = await api.blog.getPage(params);
        const posts = response.records.map(transformBlogDetailVOToBlogPost);
        return {
          posts,
          total: response.total,
        };
      } catch (error) {
        console.error('获取博客列表失败:', error);
        return {
          posts: [],
          total: 0,
        };
      }
    },

    // 获取前端格式的热门博客
    getHotBlogs: async (limit = 5): Promise<BlogPost[]> => {
      try {
        const response = await api.blog.getHot(limit);
        return response.map(transformBlogDetailVOToBlogPost);
      } catch (error) {
        console.error('获取热门博客失败:', error);
        return [];
      }
    },

    // 获取前端格式的最新博客
    getLatestBlogs: async (limit = 5): Promise<BlogPost[]> => {
      try {
        const response = await api.blog.getLatest(limit);
        return response.map(transformBlogDetailVOToBlogPost);
      } catch (error) {
        console.error('获取最新博客失败:', error);
        return [];
      }
    },

    // 创建博客
    create: async (blogData: any): Promise<BlogDetailVO> => {
      return apiClient.post('/blog', blogData) as Promise<BlogDetailVO>;
    },

    // 更新博客
    update: async (id: number, blogData: any): Promise<BlogDetailVO> => {
      return apiClient.put(`/blog/${id}`, blogData) as Promise<BlogDetailVO>;
    },

    // 删除博客
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/blog/${id}`);
    },

    // 获取关注流
    getFollowingFeed: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/following', { params });
    },

    // 获取博客版本历史
    getRevisions: async (id: number): Promise<BlogRevisionVO[]> => {
      return apiClient.get(`/blog/${id}/revisions`) as Promise<BlogRevisionVO[]>;
    },

    // 版本对比
    diffRevisions: async (blogId: number, from: number, to: number): Promise<BlogRevisionDiffVO> => {
      return apiClient.get(`/blog/${blogId}/diff`, { params: { from, to } }) as Promise<BlogRevisionDiffVO>;
    },

    // 回滚版本
    restoreRevision: async (blogId: number, revisionId: number): Promise<void> => {
      await apiClient.post(`/blog/${blogId}/revisions/${revisionId}/restore`);
    },

    // 发布博客
    publish: async (id: number): Promise<void> => {
      await apiClient.post(`/blog/${id}/publish`);
    },

    // 下线博客
    unpublish: async (id: number): Promise<void> => {
      await apiClient.post(`/blog/${id}/unpublish`);
    },

    // 获取所有公开文章
    getAllPublic: async (): Promise<BlogListVO[]> => {
      return apiClient.get('/blog/public/all') as Promise<BlogListVO[]>;
    },

    // MySQL搜索博客（ES降级方案）
    searchBlogsByMySQL: async (keyword: string, limit: number = 50): Promise<BlogListVO[]> => {
      try {
        const response = await apiClient.get('/blog/search', {
          params: { keyword, limit }
        });
        return normalizeArrayResponse<BlogListVO>(response);
      } catch (error) {
        console.error('MySQL搜索失败:', error);
        return [];
      }
    },

  },

  search: {
    searchBlogs: async (
      keyword: string,
      size: number = 10,
      page: number = 0,
      options?: SearchRequestOptions
    ) => {
      const track = options?.track ?? true;
      const source = options?.source ?? 'result';
      return apiClient.get('/search/blogs', {
        params: { keyword, size, page, track, source }
      });
    },

    advancedSearch: async (params: {
      keyword?: string;
      categoryId?: number;
      tags?: string[];
      size?: number;
      page?: number;
    }) => {
      const { keyword, categoryId, tags, size = 10, page = 0 } = params;
      return apiClient.get('/search/blogs/advanced', {
        params: {
          keyword,
          categoryId,
          tags,
          size,
          page
        }
      });
    },

    suggestions: async (prefix: string) => {
      return apiClient.get('/search/suggestions', {
        params: { prefix }
      });
    },

    status: async () => {
      return apiClient.get('/search/status');
    },

    trending: async (days: number = 7, limit: number = 10): Promise<SearchTrendVO[]> => {
      return apiClient.get('/search/trending', { params: { days, limit } }) as Promise<SearchTrendVO[]>;
    }
  },

  user: {
    // 用户注册
    register: async (userData: UserRegisterDTO): Promise<void> => {
      await apiClient.post('/user/register', userData);
    },

    // 用户登录
    login: async (loginData: UserLoginDTO): Promise<TokenResponse> => {
      return apiClient.post('/user/login', loginData) as Promise<TokenResponse>;
    },

    // 获取当前用户信息
    getCurrentUser: async (): Promise<User> => {
      return apiClient.get('/user/info') as Promise<User>;
    },

    // 更新用户信息
    updateUserInfo: async (userData: Partial<User> & { currentPassword?: string }): Promise<void> => {
      await apiClient.put('/user/info', userData);
    },

    // 修改密码
    changePassword: async (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<void> => {
      await apiClient.post('/user/change-password', passwordData);
    },

    // 用户登出
    logout: async (): Promise<void> => {
      await apiClient.post('/user/logout');
    },

    // 获取会话列表
    getSessions: async (): Promise<UserSessionVO[]> => {
      return apiClient.get('/user/sessions') as Promise<UserSessionVO[]>;
    },

    // 下线指定会话
    revokeSession: async (sessionId: number): Promise<void> => {
      await apiClient.delete(`/user/sessions/${sessionId}`);
    },

    // 屏蔽用户
    blockUser: async (blockedId: number): Promise<void> => {
      await apiClient.post(`/user/block/${blockedId}`);
    },

    // 取消屏蔽
    unblockUser: async (blockedId: number): Promise<void> => {
      await apiClient.delete(`/user/block/${blockedId}`);
    },

    // 获取屏蔽列表
    getBlockedUsers: async (): Promise<number[]> => {
      return apiClient.get('/user/block/list') as Promise<number[]>;
    },

    // 获取我的评论列表
    getMyComments: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<CommentVO>>> => {
      return apiClient.get('/comment/user/my', { params });
    },

    // 获取我点赞的博客列表
    getMyLikedBlogs: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/liked/my', { params });
    },
  },

  comment: {
    // 获取博客的评论列表
    getByBlogId: async (blogId: number, params?: PageParams): Promise<ProcessedResponse<PageResponse<CommentVO>>> => {
      return apiClient.get(`/comment/blog/${blogId}`, { params });
    },

    // 创建评论
    create: async (commentData: CommentCreateDTO): Promise<ProcessedResponse<CommentVO>> => {
      return apiClient.post('/comment', commentData);
    },

    // 删除评论
    delete: async (id: number): Promise<ProcessedResponse<void>> => {
      return apiClient.delete(`/comment/${id}`);
    },

    // 点赞/取消点赞评论
    toggleLike: async (id: number): Promise<ProcessedResponse<void>> => {
      return apiClient.post(`/comment/${id}/like`);
    },

    // 获取评论详情
    getDetail: async (id: number): Promise<ApiResponse<CommentVO>> => {
      return apiClient.get(`/comment/${id}`);
    },

    // 获取用户的评论列表
    getByUserId: async (userId: number, params?: PageParams): Promise<ApiResponse<PageResponse<CommentVO>>> => {
      return apiClient.get(`/comment/user/${userId}`, { params });
    },
  },

  report: {
    create: async (data: ReportCreateDTO): Promise<void> => {
      await apiClient.post('/report', data);
    }
  },

  category: {
    // 获取所有分类
    getAll: async (): Promise<Category[]> => {
      const response = await apiClient.get('/category/list');
      return normalizeArrayResponse<Category>(response);
    },

    // 根据ID获取分类
    getById: async (id: number): Promise<ApiResponse<Category>> => {
      return apiClient.get(`/category/${id}`);
    },

    // 创建分类
    create: async (categoryData: { name: string; description?: string }): Promise<ApiResponse<void>> => {
      return apiClient.post('/category', categoryData);
    },

    // 更新分类
    update: async (categoryData: { id: number; name: string; description?: string }): Promise<ApiResponse<void>> => {
      return apiClient.put('/category', categoryData);
    },

    // 删除分类
    delete: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/category/${id}`);
    },
  },

  tag: {
    // 获取所有标签
    getAll: async (): Promise<Tag[]> => {
      const response = await apiClient.get('/tag/list');
      return normalizeArrayResponse<Tag>(response);
    },

    // 根据ID获取标签
    getById: async (id: number): Promise<ApiResponse<{ id: number; name: string; createTime: string }>> => {
      return apiClient.get(`/tag/${id}`);
    },

    // 创建标签
    create: async (tagData: { name: string }): Promise<ApiResponse<void>> => {
      return apiClient.post('/tag', tagData);
    },

    // 更新标签
    update: async (tagData: { id: number; name: string }): Promise<ApiResponse<void>> => {
      return apiClient.put('/tag', tagData);
    },

    // 删除标签
    delete: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/tag/${id}`);
    },

    // 根据博客ID获取标签列表
    getByBlogId: async (blogId: number): Promise<TagVO[]> => {
      return apiClient.get(`/tag/blog/${blogId}`) as Promise<TagVO[]>;
    },

    // 根据博客ID获取标签（用于编辑器）
    getTags: async (blogId: number): Promise<TagVO[]> => {
      return apiClient.get(`/tag/blog/${blogId}`) as Promise<TagVO[]>;
    },

    // 获取所有被已发布博客使用的标签
    getUsedTags: async (): Promise<Tag[]> => {
      const response = await apiClient.get('/tag/used');
      return normalizeArrayResponse<Tag>(response);
    },
  },

  admin: {
    // 获取用户列表
    getUsers: async (params?: PageParams): Promise<PageResult<User>> => {
      return apiClient.get('/admin/users', { params });
    },

    // 更新用户状态
    updateUserStatus: async (userId: number, status: number): Promise<ApiResponse<void>> => {
      return apiClient.put(`/admin/users/${userId}/status`, { status });
    },

    // 获取文章列表
    getBlogs: async (params?: PageParams): Promise<PageResult<BlogDetailVO>> => {
      return apiClient.get('/admin/blogs', { params });
    },

    // 更新文章状态
    updateBlogStatus: async (blogId: number, status: number): Promise<ApiResponse<void>> => {
      return apiClient.put(`/admin/blogs/${blogId}/status`, { status });
    },

    // 删除文章
    deleteBlog: async (blogId: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/admin/blogs/${blogId}`);
    },

    // 获取评论列表
    getComments: async (params?: PageParams): Promise<PageResult<CommentVO>> => {
      return apiClient.get('/admin/comments', { params });
    },

    // 删除评论
    deleteComment: async (commentId: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/admin/comments/${commentId}`);
    },

    // 获取系统统计
    getStats: async (): Promise<ProcessedResponse<AdminStatsDTO>> => {
      return apiClient.get('/admin/stats');
    },

    // 获取分类列表（管理员）
    getCategories: async (): Promise<Category[]> => {
      return apiClient.get('/admin/categories');
    },

    // 获取标签列表（管理员）
    getTags: async (): Promise<Tag[]> => {
      return apiClient.get('/admin/tags');
    },

    // 记录页面访问
    trackVisit: async (page: string): Promise<ProcessedResponse<void>> => {
      return apiClient.post('/admin/track-visit', { page });
    },

    // 获取监控Dashboard数据
    getMonitoringDashboard: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/dashboard');
    },

    // 获取系统指标
    getMonitoringSystem: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/system');
    },

    // 获取性能指标
    getMonitoringPerformance: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/performance');
    },

    //获取业务指标
    getMonitoringBusiness: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/business');
    },

    // 获取举报列表
    getReports: async (params?: PageParams & { status?: number; targetType?: string }): Promise<PageResult<ReportVO>> => {
      return apiClient.get('/admin/reports', { params });
    },

    // 审核举报
    reviewReport: async (id: number, data: ReportReviewDTO): Promise<void> => {
      await apiClient.post(`/admin/reports/${id}/review`, data);
    },

    // 获取审计日志
    getAuditLogs: async (params?: PageParams & { operatorId?: number; action?: string }): Promise<PageResult<any>> => {
      return apiClient.get('/admin/audit-logs', { params });
    },

    // AI使用Top用户
    getAiUsageTopUsers: async (days: number = 7, limit: number = 10): Promise<AiUsageUserVO[]> => {
      return apiClient.get('/admin/ai-usage/top-users', { params: { days, limit } }) as Promise<AiUsageUserVO[]>;
    },

    // AI使用明细
    getAiUsageDaily: async (userId?: number, days: number = 7): Promise<AiUsageDailyVO[]> => {
      return apiClient.get('/admin/ai-usage/daily', { params: { userId, days } }) as Promise<AiUsageDailyVO[]>;
    },

    // OpenAI运行期配置
    getOpenAiConfig: async (): Promise<OpenAiConfigVO> => {
      return apiClient.get('/admin/openai-config') as Promise<OpenAiConfigVO>;
    },

    updateOpenAiConfig: async (data: OpenAiConfigUpdateDTO): Promise<OpenAiConfigVO> => {
      return apiClient.put('/admin/openai-config', data) as Promise<OpenAiConfigVO>;
    },

    rebuildRagIndex: async (): Promise<any> => {
      return apiClient.post('/admin/openai-config/rag/rebuild');
    },

    // ========== Arthas增强监控API ==========

    // 获取Arthas监控Dashboard（包含系统+性能+业务指标）
    getArthasMonitoringDashboard: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/arthas/dashboard');
    },

    // 获取Arthas系统指标（增强版JVM信息）
    getArthasSystemMetrics: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/arthas/system');
    },

    // 获取线程分析数据
    getArthasThreadAnalysis: async (): Promise<any> => {
      return apiClient.get('/admin/monitoring/arthas/threads');
    },

    // Arthas健康检查
    checkArthasHealth: async (): Promise<boolean> => {
      return apiClient.get('/admin/monitoring/arthas/health') as Promise<boolean>;
    },

    // 获取最近错误日志
    getRecentErrors: async (limit: number = 50): Promise<any[]> => {
      return apiClient.get(`/admin/monitoring/errors?limit=${limit}`) as Promise<any[]>;
    },

    // 获取错误统计
    getErrorStats: async (): Promise<{ count24Hours: number }> => {
      return apiClient.get('/admin/monitoring/errors/stats') as Promise<{ count24Hours: number }>;
    },

  },

  upload: {
    // 上传图片
    uploadImage: async (file: File, type: string = 'content'): Promise<{ url: string; filename: string; type: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      return apiClient.post('/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    // 上传文件
    uploadFile: async (file: File, type: string = 'document'): Promise<{ url: string; filename: string; type: string; size: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      return apiClient.post('/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    // 上传编辑器图片
    uploadEditorImage: async (file: File): Promise<{ url: string; filename: string }> => {
      const formData = new FormData();
      formData.append('file', file);
      return apiClient.post('/upload/editor/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    // 删除文件
    deleteFile: async (url: string): Promise<ApiResponse<void>> => {
      return apiClient.delete('/upload?url=' + encodeURIComponent(url));
    },
  },

  collection: {
    // 获取收藏夹列表
    getFolders: async (): Promise<CollectionFolderVO[]> => {
      return apiClient.get('/collection/folders') as Promise<CollectionFolderVO[]>;
    },

    // 创建收藏夹
    createFolder: async (folderData: CollectionFolderDTO): Promise<CollectionFolderVO> => {
      return apiClient.post('/collection/folders', folderData) as Promise<CollectionFolderVO>;
    },

    // 更新收藏夹
    updateFolder: async (id: number, folderData: CollectionFolderDTO): Promise<void> => {
      await apiClient.put(`/collection/folders/${id}`, folderData);
    },

    // 删除收藏夹
    deleteFolder: async (id: number): Promise<void> => {
      await apiClient.delete(`/collection/folders/${id}`);
    },

    // 分享收藏夹
    shareFolder: async (id: number): Promise<CollectionFolderVO> => {
      return apiClient.post(`/collection/folders/${id}/share`) as Promise<CollectionFolderVO>;
    },

    // 设置公开/私密
    setFolderPublic: async (id: number, isPublic: boolean): Promise<CollectionFolderVO> => {
      return apiClient.post(`/collection/folders/${id}/public`, null, { params: { isPublic } }) as Promise<CollectionFolderVO>;
    },

    // 获取分享的收藏夹
    getSharedFolder: async (shareCode: string, page = 1, size = 10): Promise<{ folder: CollectionFolderVO; items: UserCollectionVO[] }> => {
      return apiClient.get(`/collection/share/${shareCode}`, { params: { page, size } }) as Promise<{ folder: CollectionFolderVO; items: UserCollectionVO[] }>;
    },

    // 收藏/取消收藏
    toggle: async (data: CollectToggleDTO): Promise<CollectResultDTO> => {
      return apiClient.post('/collection/toggle', data) as Promise<CollectResultDTO>;
    },

    // 检查是否已收藏
    checkCollected: async (targetId: number, targetType = 'blog'): Promise<boolean> => {
      return apiClient.get(`/collection/check/${targetId}`, { params: { targetType } }) as Promise<boolean>;
    },

    // 获取收藏列表（指定文件夹）
    getList: async (params?: any): Promise<PageResult<UserCollectionVO>> => {
      const response = await apiClient.get('/collection/list', { params });
      const records = response as unknown as UserCollectionVO[];
      // Backend returns list directly, so we need to wrap it to maintain PageResult format
      // Use a placeholder for total - components will handle this appropriately
      return {
        records,
        total: records.length,
        current: params?.page || 1,
        size: params?.pageSize || 10
      } as PageResult<UserCollectionVO>;
    },

    // 获取所有收藏（不分文件夹）
    getAllList: async (page = 1, size = 10): Promise<UserCollectionVO[]> => {
      return apiClient.get('/collection/list/all', { params: { page, size } }) as Promise<UserCollectionVO[]>;
    },

    // 批量移动收藏
    batchMove: async (targetFolderId: number, collectionIds: number[]): Promise<void> => {
      await apiClient.post('/collection/move', null, { params: { targetFolderId, collectionIds } });
    },

    // 批量删除收藏
    batchDelete: async (collectionIds: number[]): Promise<void> => {
      // Since backend doesn't have batch delete endpoint, delete individually
      await Promise.all(collectionIds.map(id => apiClient.delete(`/collection/${id}`)));
    },

    // 删除收藏
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/collection/${id}`);
    },
  },

  follow: {
    // 关注用户
    followUser: async (userId: number): Promise<void> => {
      await apiClient.post(`/follow/${userId}`);
    },

    // 取消关注
    unfollowUser: async (userId: number): Promise<void> => {
      await apiClient.delete(`/follow/${userId}`);
    },

    // 检查关注状态
    checkFollowStatus: async (userId: number): Promise<boolean> => {
      return apiClient.get(`/follow/status/${userId}`) as Promise<boolean>;
    },

    // 获取我的粉丝列表
    getMyFollowers: async (page = 1, size = 10): Promise<FollowPageResponse> => {
      return apiClient.get('/follow/followers', { params: { page, size } }) as Promise<FollowPageResponse>;
    },

    // 获取我的关注列表
    getMyFollowing: async (page = 1, size = 10): Promise<FollowPageResponse> => {
      return apiClient.get('/follow/following', { params: { page, size } }) as Promise<FollowPageResponse>;
    },

    // 获取指定用户的粉丝列表
    getUserFollowers: async (userId: number, page = 1, size = 10): Promise<FollowPageResponse> => {
      return apiClient.get(`/follow/followers/${userId}`, { params: { page, size } }) as Promise<FollowPageResponse>;
    },

    // 获取指定用户的关注列表
    getUserFollowing: async (userId: number, page = 1, size = 10): Promise<FollowPageResponse> => {
      return apiClient.get(`/follow/following/${userId}`, { params: { page, size } }) as Promise<FollowPageResponse>;
    },

    // 获取我的粉丝数量
    getMyFollowerCount: async (): Promise<number> => {
      return apiClient.get('/follow/followers/count') as Promise<number>;
    },

    // 获取我的关注数量
    getMyFollowingCount: async (): Promise<number> => {
      return apiClient.get('/follow/following/count') as Promise<number>;
    },
  },

  auth: {
    // 保存认证信息到本地存储
    saveAuth: (token: string, user: User): void => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    },

    // 从本地存储获取认证信息
    getAuth: (): AuthState => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      return {
        user,
        token,
        isAuthenticated: !!token,
        isLoading: false,
      };
    },

    // 清除认证信息
    clearAuth: (): void => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    },

    // 检查是否已认证
    isAuthenticated: (): boolean => {
      return !!localStorage.getItem('token');
    },

    // 获取当前用户
    getCurrentUser: (): User | null => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    // 获取token
    getToken: (): string | null => {
      return localStorage.getItem('token');
    },

    // 刷新token
    refreshToken: async (): Promise<TokenResponse> => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }
      return apiClient.post('/auth/refresh', null, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      }) as Promise<TokenResponse>;
    },
  },

  captcha: {
    // 生成验证码
    generate: (): Promise<{
      captchaId: string;
      imageBase64: string;
    }> => {
      return apiClient.get('/captcha/generate') as Promise<{
        captchaId: string;
        imageBase64: string;
      }>;
    },
  },

  // 浏览记录相关API
  browseHistory: {
    // 获取用户浏览记录
    getUserHistory: async (days = 3): Promise<BrowseHistoryVO[]> => {
      return apiClient.get('/browse-history', { params: { days } }) as Promise<BrowseHistoryVO[]>;
    },
  },

  // AI助手相关API
  ai: {
    // 获取 AI助手 介绍
    getIntroduction: (): Promise<string> => {
      return apiClient.get('/ai/introduction');
    },

    // AI聊天（需要更长超时时间）
    chat: (params: { question: string; conversationId?: string; history?: any[] }): Promise<any> => {
      return apiClient.post('/ai/chat', params, {
        timeout: 60000, // 60秒超时，因为AI响应较慢
      });
    },

    chatStream: async (
      params: { question: string; conversationId?: string; history?: any[] },
      handlers: AiChatStreamHandlers,
    ): Promise<void> => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getBaseURL()}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI stream request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const dispatchEvent = (rawEvent: string) => {
        const lines = rawEvent.split(/\r?\n/);
        let eventName: AiStreamEventName = 'delta';
        const dataLines: string[] = [];

        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice('event:'.length).trim() as AiStreamEventName;
          } else if (line.startsWith('data:')) {
            dataLines.push(line.slice('data:'.length).trimStart());
          }
        }

        if (dataLines.length === 0) return;
        const rawData = dataLines.join('\n');
        let data: any = rawData;
        try {
          data = JSON.parse(rawData);
        } catch {
          // keep string data
        }

        if (eventName === 'status') handlers.onStatus?.(data.message || String(data));
        if (eventName === 'delta') handlers.onDelta?.(data.text || String(data));
        if (eventName === 'relatedArticles') handlers.onRelatedArticles?.(data.items || []);
        if (eventName === 'done') handlers.onDone?.(data);
        if (eventName === 'error') {
          const message = data.message || String(data);
          handlers.onError?.(message);
          throw new Error(message);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || '';
        events.forEach(dispatchEvent);
      }

      if (buffer.trim()) {
        dispatchEvent(buffer);
      }
    },

    // 生成文章标题（需要更长超时时间）
    generateTitle: (content: string, style?: string): Promise<{ title: string }> => {
      return apiClient.post('/ai/generate-title', { content, style }, {
        timeout: 60000,
      });
    },

    // 润色文章内容（需要更长超时时间）
    polishContent: (content: string, style?: string): Promise<{ polishedContent: string }> => {
      return apiClient.post('/ai/polish-content', { content, style }, {
        timeout: 60000,
      });
    },

    // 生成文章摘要（需要更长超时时间）
    generateSummary: (content: string, style?: string): Promise<{ summary: string }> => {
      return apiClient.post('/ai/generate-summary', { content, style }, {
        timeout: 60000,
      });
    },

    // 提取文章关键词（需要更长超时时间）
    extractKeywords: (content: string, style?: string): Promise<{ keywords: string[] }> => {
      return apiClient.post('/ai/extract-keywords', { content, style }, {
        timeout: 60000,
      });
    },
  },

  notification: {
    // 获取通知列表
    getList: async (params?: PageParams & { type?: NotificationType }): Promise<PageResult<NotificationVO>> => {
      const response = await apiClient.get('/notifications', { params });
      // 如果后端返回的是标准 PageResponse 格式（包含 records），需要适配前端 PageResult
      const pageData = response as any;

      // 处理后端返回的列表数据，解析 parsedExtraData
      let content: NotificationVO[] = [];
      if (pageData.records) {
        content = pageData.records;
      } else if (pageData.content) {
        content = pageData.content;
      } else if (Array.isArray(pageData)) {
        content = pageData;
      }

      // 解析 extraData
      content = content.map((item: NotificationVO) => {
        if (item.extraData) {
          try {
            if (typeof item.extraData === 'string') {
              item.parsedExtraData = JSON.parse(item.extraData);
            } else {
              item.parsedExtraData = item.extraData;
            }
          } catch (e) {
            console.error('Failed to parse extraData', e);
          }
        }
        return item;
      });

      // 构造返回结果
      return {
        content: content,
        totalElements: pageData.total || pageData.totalElements || content.length,
        totalPages: pageData.pages || pageData.totalPages || 1,
        size: pageData.size || params?.size || 10,
        number: pageData.current || pageData.number || 1
      };
    },

    // 获取未读数量
    getUnreadCount: async (): Promise<UnreadCountVO> => {
      return apiClient.get('/notifications/unread/count') as Promise<UnreadCountVO>;
    },

    // 标记为已读
    markAsRead: async (id: number): Promise<void> => {
      await apiClient.put(`/notifications/${id}/read`);
    },

    // 标记所有为已读
    markAllAsRead: async (): Promise<void> => {
      await apiClient.put('/notifications/read-all');
    },

    // 删除通知
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/notifications/${id}`);
    },

    // 获取通知设置
    getSettings: async (): Promise<NotificationSettingVO> => {
      return apiClient.get('/notifications/settings') as Promise<NotificationSettingVO>;
    },

    // 更新通知设置
    updateSettings: async (settings: Partial<NotificationSettingVO>): Promise<void> => {
      await apiClient.put('/notifications/settings', settings);
    }
  },
};

export const getRssFeedUrl = () => {
  if (import.meta.env.DEV) {
    return 'http://localhost:8081/api/blog/rss.xml';
  }
  return '/api/blog/rss.xml';
};
