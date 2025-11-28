import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Search,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Archive,
  PenTool,
  ClipboardList,
  Loader2,
  User,
  Calendar
} from 'lucide-react';
import { BlogStatus, type BlogDetailVO } from '../../types/api';
import { api } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

interface BlogManagementProps {
  initialStatusFilter?: BlogStatus;
}

export const BlogManagement: React.FC<BlogManagementProps> = ({ initialStatusFilter }) => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogDetailVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(initialStatusFilter);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingBlogId, setLoadingBlogId] = useState<number | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getBlogs({
        page: currentPage,
        size: 12,
        keyword: searchTerm,
        status: statusFilter
      });

      const blogData = Array.isArray(response?.records) ? response.records : [];
      const totalCount = response?.total ?? blogData.length;

      setBlogs(blogData);
      setTotalBlogs(totalCount);
    } catch (error) {
      console.error('获取文章列表失败:', error);
      setMessage({ type: 'error', text: '获取文章列表失败' });
      setBlogs([]);
      setTotalBlogs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlogStatus = async (blogId: number, currentStatus: number) => {
    try {
      setLoadingBlogId(blogId);
      let newStatus: number;
      let statusText: string;

      if (currentStatus === BlogStatus.PUBLISHED) {
        newStatus = BlogStatus.OFFLINE;
        statusText = '文章已下线';
      } else if (currentStatus === BlogStatus.OFFLINE) {
        newStatus = BlogStatus.PUBLISHED;
        statusText = '文章已发布';
      } else {
        newStatus = BlogStatus.PUBLISHED;
        statusText = '文章已发布';
      }

      await api.admin.updateBlogStatus(blogId, newStatus);
      setMessage({ type: 'success', text: statusText });
      await fetchBlogs();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('更新文章状态失败:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '更新文章状态失败'
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoadingBlogId(null);
    }
  };

  const handleDeleteBlog = async (blogId: number, title: string) => {
    if (!window.confirm(`确定要删除这篇文章吗？\n标题："${title}"\n此操作不可撤销。`)) {
      return;
    }

    try {
      setLoadingBlogId(blogId);
      await api.admin.deleteBlog(blogId);
      setMessage({ type: 'success', text: '文章删除成功' });
      await fetchBlogs();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('删除文章失败:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除文章失败'
      });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoadingBlogId(null);
    }
  };

  const getStatusBadgeVariant = (status: number) => {
    switch (status) {
      case BlogStatus.PUBLISHED:
        return 'default';
      case BlogStatus.DRAFT:
        return 'secondary';
      case BlogStatus.OFFLINE:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: number) => {
    switch (status) {
      case BlogStatus.PUBLISHED:
        return '已发布';
      case BlogStatus.DRAFT:
        return '草稿';
      case BlogStatus.OFFLINE:
        return '已下线';
      default:
        return '未知';
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case BlogStatus.PUBLISHED:
        return <FileText className="w-4 h-4" />;
      case BlogStatus.DRAFT:
        return <PenTool className="w-4 h-4" />;
      case BlogStatus.OFFLINE:
        return <Archive className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filteredBlogs = blogs.filter(blog =>
    blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.summary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">文章管理</h2>
            <p className="text-muted-foreground">管理系统中的所有博客文章</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/blog/drafts?status=draft')}
              className="flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              草稿箱
            </Button>
            <Button onClick={() => navigate('/blog/new')} className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              写文章
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalBlogs}</p>
                  <p className="text-muted-foreground text-sm">总文章数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {blogs.filter(b => b.status === BlogStatus.PUBLISHED).length}
                  </p>
                  <p className="text-muted-foreground text-sm">已发布</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <PenTool className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {blogs.filter(b => b.status === BlogStatus.DRAFT).length}
                  </p>
                  <p className="text-muted-foreground text-sm">草稿</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Archive className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {blogs.filter(b => b.status === BlogStatus.OFFLINE).length}
                  </p>
                  <p className="text-muted-foreground text-sm">已下线</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className={`border-${message.type === 'success' ? 'green' : 'red'}-200 bg-${message.type === 'success' ? 'green' : 'red'}-50`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {message.text}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索文章标题或内容..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === undefined ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(undefined)}
                >
                  全部
                </Button>
                <Button
                  variant={statusFilter === BlogStatus.PUBLISHED ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(BlogStatus.PUBLISHED)}
                >
                  已发布
                </Button>
                <Button
                  variant={statusFilter === BlogStatus.DRAFT ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(BlogStatus.DRAFT)}
                >
                  草稿
                </Button>
                <Button
                  variant={statusFilter === BlogStatus.OFFLINE ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(BlogStatus.OFFLINE)}
                >
                  已下线
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blogs Grid */}
        <div>
          {filteredBlogs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无文章数据</p>
                  <p>
                    {searchTerm || statusFilter !== undefined ? '没有找到匹配的文章' : '系统中还没有文章'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBlogs.map((blog) => {
                const isLoading = loadingBlogId === blog.id;
                return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group h-full"
                >
                  <Card className="hover:shadow-md transition-all duration-200 h-full flex flex-col">
                    <CardContent className="p-6 flex flex-col flex-1">
                      {/* Blog Header - 固定高度 */}
                      <div className="mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2 flex-1 min-h-[3.5rem]">
                            {blog.title || '无标题'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(blog.status || 1)} className="text-xs flex items-center gap-1">
                            {getStatusIcon(blog.status || 1)}
                            {getStatusText(blog.status || 1)}
                          </Badge>
                          {blog.isTop === 1 && (
                            <Badge variant="outline" className="text-xs">
                              置顶
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Blog Summary - 固定高度 */}
                      <div className="h-16 mb-4">
                        {blog.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {blog.summary}
                          </p>
                        )}
                      </div>

                      {/* Blog Metadata */}
                      <div className="space-y-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            <span className="truncate">{blog.authorName || '未知作者'}</span>
                          </div>
                          <span className="text-xs">ID: {blog.id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">
                              {blog.publishTime ?
                                new Date(blog.publishTime).toLocaleDateString('zh-CN') :
                                '未发布'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {blog.viewCount || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {blog.likeCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Blog Categories and Tags - 固定高度 */}
                      <div className="h-8 mb-3 flex items-center flex-wrap gap-1">
                        {blog.categoryName && (
                          <Badge variant="outline" className="text-xs">
                            📁 {blog.categoryName}
                          </Badge>
                        )}
                        {Array.isArray(blog.tags) &&
                          blog.tags.slice(0, 2).map((tag: any, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{typeof tag === 'string' ? tag.trim() : tag?.name || ''}
                            </Badge>
                          ))}
                      </div>

                      {/* Spacer to push buttons to bottom */}
                      <div className="flex-1"></div>

                      {/* Actions - 固定在底部 */}
                      <div className="flex gap-2 mt-auto">
                        <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                          <Button
                            variant={blog.status === BlogStatus.PUBLISHED ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleBlogStatus(blog.id, blog.status || 1)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              blog.status === BlogStatus.PUBLISHED ? '下线' : '发布'
                            )}
                          </Button>
                        </motion.div>
                        <motion.div whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBlog(blog.id, blog.title || '无标题')}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalBlogs > 12 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                第 {currentPage} 页，共 {Math.ceil(totalBlogs / 12)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalBlogs / 12)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
