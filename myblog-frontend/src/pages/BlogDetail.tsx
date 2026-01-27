import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Heart, Share2, MessageCircle, FileText, Tag, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
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
        window.scrollTo(0, 0);
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  const handleLike = useCallback(async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!blog || isLiking) return;

    try {
      setIsLiking(true);
      const result: LikeResultDTO = await api.blog.toggleLikeWithDetails(blog.id);
      setIsLiked(result.isLiked);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
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

  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
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
      <div className="bg-muted/30 border-b border-border py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Meta info */}
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-mono-display uppercase tracking-wider border border-accent/30">
              {blogData.categoryName || '未分类'}
            </span>
            <span className="text-muted-foreground text-xs font-mono-display uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-editorial-lg text-foreground mb-8 leading-tight">
            {blogData.title}
          </h1>

          {/* Author and actions */}
          <div className="flex items-center justify-between flex-wrap gap-6 pt-6 border-t border-border">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-foreground text-background flex items-center justify-center text-sm font-bold font-mono-display">
                {(blogData.authorName || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-foreground">{blogData.authorName || 'Unknown'}</div>
                <div className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil((blogData.content?.length || 0) / 500)} min</span>
                  <span>·</span>
                  <span>{blogData.viewCount} views</span>
                </div>
              </div>
              <FollowButton
                userId={blogData.authorId}
                username={blogData.authorName}
                size="sm"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className={`rounded-sm w-10 h-10 p-0 flex items-center justify-center ${isLiked ? 'border-accent text-accent' : ''}`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              <CollectButton
                blogId={blog.id}
                size="icon"
                className="rounded-sm w-10 h-10 p-0 flex items-center justify-center"
              />
              <Button variant="outline" className="rounded-sm w-10 h-10 p-0 flex items-center justify-center" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <main className="flex-1 min-w-0">
          <article className="prose prose-lg prose-neutral dark:prose-invert max-w-none">
            {blogData.coverImg && (
              <img
                src={blogData.coverImg}
                alt={blogData.title}
                className="w-full aspect-video object-cover mb-10"
              />
            )}

            {/* AI功能区域 */}
            <div className="mb-10 p-6 border border-border bg-card">
              <h3 className="text-sm font-mono-display uppercase tracking-wider mb-6 flex items-center gap-2">
                <span className="text-accent">AI 助手</span>
              </h3>

              <div className="flex gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="rounded-sm font-mono-display text-xs uppercase tracking-wider"
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
                  className="rounded-sm font-mono-display text-xs uppercase tracking-wider"
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
                <div className="mb-6 p-4 bg-muted/30 border border-border">
                  <p className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-3 h-3 text-accent" />
                    文章摘要
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {aiSummary}
                  </p>
                </div>
              )}

              {/* 关键词显示 */}
              {aiKeywords.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Tag className="w-3 h-3 text-accent" />
                    智能关键词
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent/10 text-accent text-xs font-mono-display uppercase tracking-wider border border-accent/30"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            {blogData.content ? (
              <MarkdownRenderer content={blogData.content} />
            ) : (
              <p className="text-muted-foreground">暂无内容</p>
            )}
          </article>

          {/* Comments */}
          <div className="border-t border-border mt-16 pt-10">
            <h3 className="text-xl font-bold text-foreground mb-8 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-accent" />
              评论 ({commentCount})
            </h3>
            <CommentSection blogId={blog.id} onCommentCountChange={handleCommentCountChange} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default React.memo(BlogDetail);
