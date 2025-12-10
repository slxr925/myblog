import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Heart,
  Calendar,
  MessageCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { api } from '../../utils/api';
import type { BlogDetailVO } from '../../types/api';

const PAGE_SIZE = 12;

// 扩展类型，添加点赞时间
interface LikedBlogVO extends BlogDetailVO {
  likedTime?: string;
}

// 将后端数据转换为前端展示格式
const transformLikedBlog = (blog: LikedBlogVO) => {
  // 处理日期格式
  let publishDate = '';
  try {
    if (blog.publishTime) {
      let dateObj: Date;
      if (Array.isArray(blog.publishTime)) {
        const [year, month, day, hour, minute, second] = blog.publishTime;
        dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
      } else {
        dateObj = new Date(blog.publishTime);
      }
      publishDate = dateObj.toLocaleDateString('zh-CN');
    }
  } catch (error) {
    console.error('日期转换错误:', error);
    publishDate = '未知日期';
  }

  // 处理点赞时间
  let likedDate = '';
  try {
    if (blog.likedTime) {
      likedDate = new Date(blog.likedTime).toLocaleDateString('zh-CN');
    }
  } catch (error) {
    console.error('点赞时间转换错误:', error);
    likedDate = '未知';
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

  return {
    ...blog,
    publishDate,
    likedDate,
    tags,
    readTime: `${Math.ceil((blog.content?.length || 0) / 500)}分钟`,
  };
};

const MyLikes: React.FC = () => {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<LikedBlogVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [unlikingIds, setUnlikingIds] = useState<Set<number>>(new Set());

  const fetchLikedBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.user.getMyLikedBlogs({
        page,
        size: PAGE_SIZE,
      });

      const records = response?.records || [];
      setBlogs(records);
      setTotal(response?.total || 0);
    } catch (err) {
      console.error('获取点赞列表失败:', err);
      setError('获取点赞列表失败，请稍后重试');
      setBlogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleUnlike = async (blogId: number) => {
    try {
      setUnlikingIds(prev => new Set(prev).add(blogId));
      await api.blog.toggleLike(blogId);

      // 重新获取列表
      await fetchLikedBlogs();
    } catch (err) {
      console.error('取消点赞失败:', err);
      // 可以添加错误提示
    } finally {
      setUnlikingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(blogId);
        return newSet;
      });
    }
  };

  const handleBlogClick = (blogId: number) => {
    navigate(`/blog/${blogId}`);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          我的喜爱
        </h2>
        <p className="text-muted-foreground mt-1">
          您点赞过的博客文章
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <CardContent className="p-4">
            {error}
          </CardContent>
        </Card>
      )}

      {/* 博客列表 */}
      {blogs.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">还没有点赞任何文章</h3>
              <p className="text-muted-foreground">
                去发现一些有趣的内容并点赞吧！
              </p>
            </div>
            <Button onClick={() => navigate('/blog')}>
              浏览文章
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog, index) => {
              const transformedBlog = transformLikedBlog(blog);
              const isUnliking = unlikingIds.has(blog.id);

              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* 封面图 */}
                    <div
                      className="relative h-48 overflow-hidden cursor-pointer"
                      onClick={() => handleBlogClick(blog.id)}
                    >
                      <img
                        src={blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`}
                        alt={blog.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* 标签 */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="absolute top-3 left-3 flex gap-2">
                          {blog.tags.slice(0, 2).map((tag, tagIndex) => (
                            <Badge
                              key={tagIndex}
                              variant="secondary"
                              className="bg-white/90 backdrop-blur-sm"
                            >
                              {typeof tag === 'string' ? tag : tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5">
                      {/* 标题和摘要 */}
                      <div className="mb-4">
                        <h3
                          className="text-lg font-semibold text-foreground mb-2 line-clamp-2 cursor-pointer group-hover:text-primary transition-colors"
                          onClick={() => handleBlogClick(blog.id)}
                        >
                          {blog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {blog.summary || '暂无摘要'}
                        </p>
                      </div>

                      {/* 元信息 */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          发布于 {transformedBlog.publishDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          点赞于 {transformedBlog.likedDate}
                        </span>
                      </div>

                      {/* 作者和统计 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(blog.authorName || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {blog.authorName || '匿名'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {blog.viewCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {blog.likeCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {blog.commentCount || 0}
                          </span>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleBlogClick(blog.id)}
                        >
                          查看详情
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleUnlike(blog.id)}
                          disabled={isUnliking}
                        >
                          {isUnliking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Heart className="w-4 h-4 fill-current" />
                          )}
                          取消点赞
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              上一页
            </Button>

            <div className="text-sm text-muted-foreground">
              第 {page} / {totalPages} 页，共 {total} 篇文章
            </div>

            <Button
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                '下一页'
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MyLikes;