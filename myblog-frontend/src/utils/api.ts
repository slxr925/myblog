import axios from 'axios';
import type { 
  ApiResponse, 
  PageParams, 
  PageResponse, 
  BlogDetailVO, 
  BlogDetailEnhancedVO,
  Category, 
  TagVO,
  BlogPost,
  User,
  UserRegisterDTO,
  UserLoginDTO,
  AuthState,
  CommentVO,
  CommentCreateDTO
} from '../types/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:8081/api',
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
    console.log('API响应成功:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API响应错误:', error.config?.url, error.response?.status, error.message);
    if (error.response?.status === 401) {
      // 未授权，清除本地存储的认证信息
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 跳转到首页，让用户重新登录
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// 工具函数：将后端BlogDetailVO转换为前端BlogPost
const transformBlogDetailVOToBlogPost = (blog: BlogDetailVO): BlogPost => {
  console.log('转换博客数据:', blog.id, blog.title);

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
  
  console.log('转换后的文章:', transformedPost);
  return transformedPost;
};

// API 请求工具
export const api = {
  blog: {
    // 分页获取博客列表
    getPage: async (params?: PageParams): Promise<ApiResponse<PageResponse<BlogDetailVO>>> => {
      return apiClient.get('/blog/page', { params });
    },

    // 获取博客详情
    getDetail: async (id: number): Promise<ApiResponse<BlogDetailVO>> => {
      return apiClient.get(`/blog/${id}`);
    },

    // 获取增强版博客详情
    getDetailEnhanced: async (id: number): Promise<ApiResponse<BlogDetailEnhancedVO>> => {
      return apiClient.get(`/blog/${id}/enhanced`);
    },

    // 获取热门博客
    getHot: async (limit = 10): Promise<ApiResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/hot', { params: { limit } });
    },

    // 获取最新博客
    getLatest: async (limit = 10): Promise<ApiResponse<BlogDetailVO[]>> => {
      return apiClient.get('/blog/latest', { params: { limit } });
    },

    // 根据分类获取博客
    getByCategory: async (categoryId: number, limit = 10): Promise<ApiResponse<BlogDetailVO[]>> => {
      return apiClient.get(`/blog/category/${categoryId}`, { params: { limit } });
    },

    // 获取相关推荐博客
    getRelated: async (id: number, limit = 5): Promise<ApiResponse<BlogDetailVO[]>> => {
      return apiClient.get(`/blog/${id}/related`, { params: { limit } });
    },

    // 点赞/取消点赞
    toggleLike: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.post(`/blog/${id}/like`);
    },

    // 获取前端格式的博客列表
    getBlogList: async (params?: PageParams): Promise<{ posts: BlogPost[]; total: number }> => {
      try {
        const response = await api.blog.getPage(params);
        const posts = response.data.records.map(transformBlogDetailVOToBlogPost);
        return {
          posts,
          total: response.data.total,
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
        return response.data.map(transformBlogDetailVOToBlogPost);
      } catch (error) {
        console.error('获取热门博客失败:', error);
        return [];
      }
    },

    // 获取前端格式的最新博客
    getLatestBlogs: async (limit = 5): Promise<BlogPost[]> => {
      try {
        const response = await api.blog.getLatest(limit);
        return response.data.map(transformBlogDetailVOToBlogPost);
      } catch (error) {
        console.error('获取最新博客失败:', error);
        return [];
      }
    },

    // 创建博客
    create: async (blogData: any): Promise<ApiResponse<void>> => {
      return apiClient.post('/blog', blogData);
    },

    // 更新博客
    update: async (id: number, blogData: any): Promise<ApiResponse<void>> => {
      return apiClient.put(`/blog/${id}`, blogData);
    },

    // 删除博客
    delete: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/blog/${id}`);
    },

    // 发布博客
    publish: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.post(`/blog/${id}/publish`);
    },

    // 下线博客
    unpublish: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.post(`/blog/${id}/unpublish`);
    },
  },

  category: {
    // 获取所有分类
    getAll: async (): Promise<ApiResponse<Category[]>> => {
      return apiClient.get('/category/list');
    },

    // 根据ID获取分类
    getById: async (id: number): Promise<ApiResponse<Category>> => {
      return apiClient.get(`/category/${id}`);
    },
  },

  tag: {
    // 获取所有标签
    getAll: async (): Promise<ApiResponse<TagVO[]>> => {
      return apiClient.get('/tag/list');
    },

    // 根据ID获取标签
    getById: async (id: number): Promise<ApiResponse<TagVO>> => {
      return apiClient.get(`/tag/${id}`);
    },

    // 根据博客ID获取标签
    getByBlogId: async (blogId: number): Promise<ApiResponse<TagVO[]>> => {
      return apiClient.get(`/tag/blog/${blogId}`);
    },
  },

  user: {
    // 用户注册
    register: async (userData: UserRegisterDTO): Promise<ApiResponse<void>> => {
      console.log('API: 发送注册请求', userData);
      const response = await apiClient.post('/user/register', userData);
      console.log('API: 注册请求响应', response.data);
      return response.data;
    },

    // 用户登录
    login: async (loginData: UserLoginDTO): Promise<ApiResponse<string>> => {
      console.log('API: 发送登录请求', loginData);
      const response = await apiClient.post('/user/login', loginData);
      console.log('API: 登录响应', response.data);
      return response.data;
    },

    // 获取当前用户信息
    getCurrentUser: async (): Promise<ApiResponse<User>> => {
      console.log('API: 获取当前用户信息');
      const response = await apiClient.get('/user/info');
      console.log('API: 用户信息响应', response.data);
      return response.data;
    },

    // 更新用户信息
    updateUserInfo: async (userData: Partial<User>): Promise<ApiResponse<void>> => {
      return apiClient.put('/user/info', userData);
    },

    // 修改密码
    changePassword: async (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse<void>> => {
      return apiClient.post('/user/change-password', passwordData);
    },

    // 用户登出
    logout: async (): Promise<ApiResponse<void>> => {
      return apiClient.post('/user/logout');
    },
  },

  comment: {
    // 获取博客的评论列表
    getByBlogId: async (blogId: number, params?: PageParams): Promise<ApiResponse<PageResponse<CommentVO>>> => {
      return apiClient.get(`/comment/blog/${blogId}`, { params });
    },

    // 创建评论
    create: async (commentData: CommentCreateDTO): Promise<ApiResponse<void>> => {
      return apiClient.post('/comment', commentData);
    },

    // 删除评论
    delete: async (id: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/comment/${id}`);
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

  admin: {
    // 获取用户列表
    getUsers: async (params?: PageParams): Promise<ApiResponse<PageResponse<User>>> => {
      return apiClient.get('/admin/users', { params });
    },

    // 更新用户状态
    updateUserStatus: async (userId: number, status: number): Promise<ApiResponse<void>> => {
      return apiClient.put(`/admin/users/${userId}/status`, { status });
    },

    // 获取文章列表
    getBlogs: async (params?: PageParams): Promise<ApiResponse<PageResponse<BlogDetailVO>>> => {
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
    getComments: async (params?: PageParams): Promise<ApiResponse<PageResponse<CommentVO>>> => {
      return apiClient.get('/admin/comments', { params });
    },

    // 删除评论
    deleteComment: async (commentId: number): Promise<ApiResponse<void>> => {
      return apiClient.delete(`/admin/comments/${commentId}`);
    },

    // 获取系统统计
    getStats: async (): Promise<ApiResponse<{
      totalUsers: number;
      totalBlogs: number;
      totalComments: number;
      todayViews: number;
    }>> => {
      return apiClient.get('/admin/stats');
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
};