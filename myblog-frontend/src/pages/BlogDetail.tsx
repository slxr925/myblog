import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, Eye, Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { api } from '../utils/api';
import type { BlogDetailVO } from '../types/api';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<BlogDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log('获取文章详情:', id);
        // 先尝试使用普通文章详情API，避免增强版API的问题
        const response = await api.blog.getDetail(Number(id));
        console.log('文章详情响应:', response);
        console.log('响应数据:', response.data);
        
        // 直接使用响应数据
        setBlog(response.data);
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
        setError('获取文章详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">文章不存在</h2>
            <p className="text-muted-foreground mb-4">{error || '该文章可能已被删除或不存在'}</p>
            <Button onClick={() => navigate('/')}>返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const blogData = blog;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      {/* 导航栏 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回首页</span>
            </Button>
            <h1 className="text-xl font-bold text-foreground">文章详情</h1>
            <div className="w-20"></div> {/* 占位保持对称 */}
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 文章头部信息 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {blogData.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {Math.ceil((blogData.content?.length || 0) / 500)}分钟阅读
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {blogData.viewCount}
              </span>
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {blogData.likeCount}
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {blogData.commentCount}
              </span>
            </div>

            {blogData.tags && blogData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {blogData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {typeof tag === 'string' ? tag : tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {blogData.summary && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground/80 leading-relaxed">{blogData.summary}</p>
              </div>
            )}
          </motion.div>

          {/* 文章内容 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prose prose-lg max-w-none"
          >
            <MarkdownRenderer content={blogData.content} />
          </motion.div>

          {/* 相关推荐 - 暂时移除，因为普通API不包含相关推荐数据 */}
        </div>
      </div>
    </motion.div>
  );
};

export default BlogDetail;