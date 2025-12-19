import axios from 'axios';
import type {
  ApiResponse,
  ProcessedResponse,
  PageParams,
  PageResponse,
  PageResult,
  BlogDetailVO,
  BlogDetailEnhancedVO,
  BlogListVO,
  Category,
  TagVO,
  Tag,
  BlogPost,
  User,
  UserRegisterDTO,
  UserLoginDTO,
  AuthState,
  CommentVO,
  CommentCreateDTO,
  AdminStatsDTO,
  LikeResultDTO,
  CollectionFolderVO,
  CollectionFolderDTO,
  CollectToggleDTO,
  CollectResultDTO,
  UserCollectionVO,
  UserFollowVO,
  FollowPageResponse
} from '../types/api';

// 创建axios实例
// 根据环境自动选择API地址
const getBaseURL = () => {
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
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.isAuthError = error.response?.status === 401;

    return Promise.reject(enhancedError);
  }
);

// 工具函数：将后端BlogDetailVO转换为前端BlogPost
const transformBlogDetailVOToBlogPost = (blog: BlogDetailVO): BlogPost => {

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

// API 请求工具
export const api = {
  blog: {
    // 分页获取博客列表
    getPage: async (params?: PageParams): Promise<ProcessedResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/page', { params });
    },

    // 获取博客详情
    getDetail: async (id: number): Promise<BlogDetailVO> => {
      return apiClient.get(`/blog/${id}`) as Promise<BlogDetailVO>;
    },

    // 根据ID获取博客（用于编辑器）
    getById: async (id: number): Promise<BlogDetailVO> => {
      return apiClient.get(`/blog/${id}`) as Promise<BlogDetailVO>;
    },

    // 获取增强版博客详情
    getDetailEnhanced: async (id: number): Promise<BlogDetailEnhancedVO> => {
      return apiClient.get(`/blog/${id}/enhanced`) as Promise<BlogDetailEnhancedVO>;
    },

    // 获取热门博客
    getHot: async (limit = 10): Promise<ProcessedResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/hot', { params: { limit } });
    },

    // 获取最新博客
    getLatest: async (limit = 10): Promise<ProcessedResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/latest', { params: { limit } });
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
    searchBlogs: async (keyword: string, size: number = 10, page: number = 0) => {
      return apiClient.get('/search/blogs', {
        params: { keyword, size, page }
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
    }
  },

  user: {
    // 用户注册
    register: async (userData: UserRegisterDTO): Promise<void> => {
      await apiClient.post('/user/register', userData);
    },

    // 用户登录
    login: async (loginData: UserLoginDTO): Promise<string> => {
      return apiClient.post('/user/login', loginData) as Promise<string>;
    },

    // 获取当前用户信息
    getCurrentUser: async (): Promise<User> => {
      return apiClient.get('/user/info') as Promise<User>;
    },

    // 更新用户信息
    updateUserInfo: async (userData: Partial<User>): Promise<void> => {
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
    create: async (commentData: CommentCreateDTO): Promise<ProcessedResponse<void>> => {
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
  },

  upload: {
    // 上传图片
    uploadImage: async (file: File, type: string = 'content'): Promise<ApiResponse<{ url: string; filename: string; type: string }>> => {
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
    uploadFile: async (file: File, type: string = 'document'): Promise<ApiResponse<{ url: string; filename: string; type: string; size: string }>> => {
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
    uploadEditorImage: async (file: File): Promise<ApiResponse<{ url: string; filename: string }>> => {
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
      const records = response as UserCollectionVO[];
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
  },

  // AI助手相关API
  ai: {
    // AI聊天
    chat: (request: { question: string; conversationId?: string; history?: { role: string; content: string }[] }) => {
      return apiClient.post('/ai/chat', request);
    },

    // 获取AI助手介绍
    getIntroduction: (): Promise<string> => {
      return apiClient.get('/ai/introduction');
    },
  },
};