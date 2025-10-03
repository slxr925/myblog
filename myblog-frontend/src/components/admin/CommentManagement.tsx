import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Search, Reply, Trash2, MoreHorizontal, Calendar } from 'lucide-react';
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

  useEffect(() => {
    fetchComments();
  }, [currentPage, searchTerm]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getComments({
        page: currentPage,
        size: 10,
        keyword: searchTerm
      });
      setComments(response.data.records);
      setTotalComments(response.data.total);
    } catch (error) {
      console.error('获取评论列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('确定要删除这条评论吗？此操作不可撤销。')) {
      try {
        await api.admin.deleteComment(commentId);
        fetchComments();
      } catch (error) {
        console.error('删除评论失败:', error);
      }
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
          <h2 className="text-2xl font-bold">评论管理</h2>
          <p className="text-muted-foreground">管理系统中的所有用户评论</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回控制台
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索评论内容或用户名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* 评论列表 */}
      <Card>
        <CardHeader>
          <CardTitle>评论列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.userAvatar} alt={comment.username} />
                        <AvatarFallback>
                          {comment.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{comment.username}</span>
                          <span className="text-sm text-muted-foreground">
                            评论于文章 ID: {comment.blogId}
                          </span>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(comment.createTime).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="ghost" size="sm">
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无评论数据
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};