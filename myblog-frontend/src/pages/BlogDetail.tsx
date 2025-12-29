import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Heart, Share2, MessageCircle, FileText, Tag, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { api } from '../utils/api';
import type { BlogDetailVO, LikeResultDTO } from '../types/api';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { CommentSection } from '../components/comment/CommentSection';
import CollectButton from '../components/blog/CollectButton';
import FollowButton from '../components/user/FollowButton';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const { openAuthModal } = useAuthModal();

  // AI 功能状态
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);

  const blogData = blog || {} as BlogDetailVO;

  // AI 生成摘要
  const handleGenerateSummary = async () => {
    if (!blog?.content) return;
    setIsGeneratingSummary(true);
    try {
      const result = await api.ai.generateSummary(blog.content);
      setAiSummary(result.summary);
      toast.success('摘要生成成功');
    } catch (error) {
      console.error('摘要生成失败:', error);
      toast.error('摘要生成失败');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI 提取关键词
  const handleExtractKeywords = async () => {
    if (!blog?.content) return;
    setIsExtractingKeywords(true);
    try {
      const result = await api.ai.extractKeywords(blog.content);
      setAiKeywords(result.keywords);
      toast.success('关键词提取成功');
    } catch (error) {
      console.error('关键词提取失败:', error);
      toast.error('关键词提取失败');
    } finally {
      setIsExtractingKeywords(false);
    }
  };

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.blog.getDetail(Number(id));
        setBlog(response);

        setIsLiked(response.isLiked || false);
        setCommentCount(response.commentCount || 0);

        api.admin.trackVisit(`/blog/${id}`).catch(err =>
          console.warn('记录博客访问失败:', err)
        );
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
      } finally {
        // 确保页面从顶部开始显示
        window.scrollTo(0, 0);
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  // 使用useCallback优化函数，避免每次渲染都创建新函数
  const handleLike = useCallback(async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!blog || isLiking) return; // 防止快速重复点击

    try {
      setIsLiking(true);
      const result: LikeResultDTO = await api.blog.toggleLikeWithDetails(blog.id);
      // 只更新点赞相关的状态，不更新整个 blog 对象，避免触发子组件重新渲染
      setIsLiked(result.isLiked);

    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      // 300ms 防抖，既能防止并发问题，又不会让用户感觉卡顿
      setTimeout(() => setIsLiking(false), 300);
    }
  }, [user, blog, isLiking, openAuthModal]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogData.title,
          text: blogData.summary,
          url: window.location.href,
        });
      } catch (error) { }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [blogData.title, blogData.summary]);

  // 处理评论计数变化
  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">文章不存在</h2>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Article Header */}
      <div className="bg-muted/30 border-b border-border py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="default">{blogData.categoryName || '未分类'}</Badge>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
            {blogData.title}
          </h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                {(blogData.authorName || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground">{blogData.authorName || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil((blogData.content?.length || 0) / 500)} min read</span>
                  <span>·</span>
                  <span>{blogData.viewCount} views</span>
                </div>
              </div>
              {/* 新增关注按钮 */}
              <FollowButton
                userId={blogData.authorId}
                username={blogData.authorName}
                size="sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={isLiked ? "default" : "secondary"}
                className={`rounded-full w-10 h-10 p-0 flex items-center justify-center ${isLiked ? 'bg-red-500 hover:bg-red-600' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <CollectButton
                blogId={blog.id}
                size="icon"
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center"
              />
              <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Main Column: Content */}
          <main className="flex-1 min-w-0">
            <article className="prose prose-lg prose-indigo dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-2xl prose-img:shadow-xl">
            {blogData.coverImg && (
              <img
                src={blogData.coverImg}
                alt={blogData.title}
                className="w-full aspect-video object-cover mb-10 rounded-2xl"
              />
            )}

            {/* AI功能区 - 移至上方 */}
            <div className="mb-8 p-6 bg-muted/30 rounded-2xl border border-border">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">AI 助手</span>
              </h3>

              <div className="flex gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="bg-background"
                >
                  {isGeneratingSummary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      生成中
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      生成摘要
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractKeywords}
                  disabled={isExtractingKeywords}
                  className="bg-background"
                >
                  {isExtractingKeywords ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      提取中
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      提取关键词
                    </>
                  )}
                </Button>
              </div>

              {/* 摘要显示 */}
              {aiSummary && (
                <Card className="mb-6 bg-background/50 border-0 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      文章摘要
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {aiSummary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 关键词显示 */}
              {aiKeywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    智能关键词
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {aiKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-background text-indigo-700 hover:bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {blogData.content ? (
              <MarkdownRenderer content={blogData.content} />
            ) : (
              <p className="text-muted-foreground">暂无内容</p>
            )}
          </article>

          {/* Comments Section */}
          <div className="border-t border-border mt-16 pt-10">
            <h3 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" /> 评论 ({commentCount})
            </h3>
            <CommentSection blogId={blog.id} onCommentCountChange={handleCommentCountChange} />
            </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(BlogDetail);