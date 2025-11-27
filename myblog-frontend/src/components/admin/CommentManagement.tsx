import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Search,
  Reply,
  Trash2,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { type CommentVO } from '../../types/api';
import { api } from '../../utils/api';

interface CommentManagementProps {
  onBack: () => void;
}

export const CommentManagement: React.FC<CommentManagementProps> = ({ onBack }) => {
  const [comments, setComments] = useState<CommentVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchComments();
  }, [currentPage, searchTerm]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getComments({
        page: currentPage,
        size: 12,
        keyword: searchTerm
      });

      const commentData = Array.isArray(response?.records) ? response.records : [];
      const totalCount = response?.total ?? commentData.length;

      setComments(commentData);
      setTotalComments(totalCount);
    } catch (error) {
      console.error('获取评论列表失败:', error);
      setMessage({ type: 'error', text: '获取评论列表失败' });
      setComments([]);
      setTotalComments(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number, content: string) => {
    if (!window.confirm(`确定要删除这条评论吗？\n内容："${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`)) {
      return;
    }

    try {
      await api.admin.deleteComment(commentId);
      setMessage({ type: 'success', text: '评论删除成功' });
      fetchComments();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('删除评论失败:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '删除评论失败'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const getInitials = (nickname: string, username: string) => {
    const name = nickname || username || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '未知时间';
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return `${diffDays}天前`;
      } else if (diffHours > 0) {
        return `${diffHours}小时前`;
      } else {
        return '刚刚';
      }
    } catch {
      return '未知时间';
    }
  };

  const filteredComments = comments.filter(comment =>
    comment.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回控制台
            </Button>
            <div>
              <h1 className="text-3xl font-bold">评论管理</h1>
              <p className="text-muted-foreground">管理系统中的所有用户评论</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalComments}</p>
                  <p className="text-muted-foreground text-sm">总评论数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {comments.filter(c => {
                      const createdAt = new Date(c.createTime || '');
                      const twentyFourHoursAgo = new Date();
                      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
                      return createdAt >= twentyFourHoursAgo;
                    }).length}
                  </p>
                  <p className="text-muted-foreground text-sm">24小时内新增</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(comments.map(c => c.username || c.nickname)).size}
                  </p>
                  <p className="text-muted-foreground text-sm">活跃评论者</p>
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
              className="mb-6"
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

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索评论内容或用户名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Comments Grid */}
        <div className="grid gap-6">
          {filteredComments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无评论数据</p>
                  <p>
                    {searchTerm ? '没有找到匹配的评论' : '系统中还没有评论'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredComments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      {/* User Info */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={comment.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {getInitials(comment.nickname || '', comment.username || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {comment.nickname || comment.username || '匿名用户'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTime(comment.createTime || '')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground mb-1">
                            ID: {comment.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            博客: {comment.blogId}
                          </div>
                        </div>
                      </div>

                      {/* Comment Content */}
                      <div className="mb-4">
                        <p className="text-sm leading-relaxed bg-muted p-3 rounded-lg">
                          {comment.content || '无内容'}
                        </p>
                      </div>

                      {/* Comment Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <span>用户名: @{comment.username || 'unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {comment.createTime ?
                            new Date(comment.createTime).toLocaleDateString('zh-CN') :
                            '未知时间'
                          }
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id, comment.content || '')}
                          className="flex-1 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除评论
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalComments > 12 && (
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
                第 {currentPage} 页，共 {Math.ceil(totalComments / 12)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalComments / 12)}
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