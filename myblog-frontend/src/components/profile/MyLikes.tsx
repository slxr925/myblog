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
  Loader2
} from 'lucide-react';
import { api } from '../../utils/api';
import type { BlogDetailVO } from '../../types/api';

const PAGE_SIZE = 6;

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
    const previousBlogs = [...blogs];
    setBlogs(prev => prev.filter(blog => blog.id !== blogId));
    setTotal(prev => Math.max(0, prev - 1));

    try {
      await api.blog.toggleLikeWithDetails(blogId);
    } catch (err) {
      console.error('取消点赞失败:', err);
      setBlogs(previousBlogs);
      setTotal(prev => previousBlogs.length);
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
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-accent" />
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
          <Heart className="w-6 h-6 text-accent" />
          我的喜爱
        </h2>
        <p className="text-muted-foreground mt-1">
          您点赞过的博客文章
        </p>
      </div>

      {error && (
        <Card className="rounded-none border-border bg-muted/20 text-foreground">
          <CardContent className="p-4">
            {error}
          </CardContent>
        </Card>
      )}

      {/* 博客列表 */}
      {blogs.length === 0 ? (
        <Card className="rounded-none border-border p-12">
          <div className="text-center space-y-4">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">还没有点赞任何文章</h3>
              <p className="text-muted-foreground">
                去发现一些有趣的内容并点赞吧！
              </p>
            </div>
            <Button onClick={() => navigate('/blog')} className="rounded-none">
              浏览文章
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {blogs.map((blog, index) => {
              const transformedBlog = transformLikedBlog(blog);

              return (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="group cursor-pointer rounded-none border-border py-0 transition-colors duration-200 hover:border-accent/40"
                    onClick={() => handleBlogClick(blog.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/400/300.jpg`}
                            alt={blog.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="mb-1.5 line-clamp-1 font-medium text-foreground transition-colors group-hover:text-accent">
                            {blog.title}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {transformedBlog.publishDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-accent text-accent" />
                              {transformedBlog.likedDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(blog.authorName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground max-w-[80px] truncate">
                              {blog.authorName || '匿名'}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-accent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnlike(blog.id);
                            }}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* 分页 */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {page}/{totalPages}页 共{total}篇
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || loading}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
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
          </div>
        </>
      )}
    </div>
  );
};

export default MyLikes;
