import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Search, Eye, Edit, Trash2, MoreHorizontal, Calendar, User } from 'lucide-react';
import { BlogStatus, type BlogDetailVO } from '../../types/api';
import { api } from '../../utils/api';

interface BlogManagementProps {
  onBack: () => void;
}

export const BlogManagement: React.FC<BlogManagementProps> = ({ onBack }) => {
  const [blogs, setBlogs] = useState<BlogDetailVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlogs, setTotalBlogs] = useState(0);

  useEffect(() => {
    fetchBlogs();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getBlogs({
        page: currentPage,
        size: 10,
        keyword: searchTerm,
        status: statusFilter
      });
      setBlogs(response.data.records);
      setTotalBlogs(response.data.total);
    } catch (error) {
      console.error('获取文章列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlogStatus = async (blogId: number, currentStatus: number) => {
    try {
      let newStatus: number;
      if (currentStatus === BlogStatus.PUBLISHED) {
        newStatus = BlogStatus.OFFLINE;
      } else if (currentStatus === BlogStatus.OFFLINE) {
        newStatus = BlogStatus.PUBLISHED;
      } else {
        newStatus = BlogStatus.PUBLISHED;
      }

      await api.admin.updateBlogStatus(blogId, newStatus);
      fetchBlogs();
    } catch (error) {
      console.error('更新文章状态失败:', error);
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      try {
        await api.admin.deleteBlog(blogId);
        fetchBlogs();
      } catch (error) {
        console.error('删除文章失败:', error);
      }
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">文章管理</h2>
          <p className="text-muted-foreground">管理系统中的所有博客文章</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回控制台
        </Button>
      </div>

      {/* 搜索和筛选栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索文章标题..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : undefined)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="">全部状态</option>
              <option value={BlogStatus.PUBLISHED}>已发布</option>
              <option value={BlogStatus.DRAFT}>草稿</option>
              <option value={BlogStatus.OFFLINE}>已下线</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* 文章列表 */}
      <Card>
        <CardHeader>
          <CardTitle>文章列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-4">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{blog.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {blog.summary}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{blog.authorName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(blog.createTime || '').toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{blog.viewCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <Badge variant={getStatusBadgeVariant(blog.status)}>
                          {getStatusText(blog.status)}
                        </Badge>
                        {blog.isTop === 1 && (
                          <Badge variant="outline">置顶</Badge>
                        )}
                        {blog.categoryName && (
                          <Badge variant="outline">{blog.categoryName}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleBlogStatus(blog.id, blog.status)}
                      >
                        {blog.status === BlogStatus.PUBLISHED ? '下线' : '发布'}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBlog(blog.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {blogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无文章数据
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};