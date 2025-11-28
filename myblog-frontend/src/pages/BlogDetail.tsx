import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Heart, Share2, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { api } from '../utils/api';
import type { BlogDetailVO, LikeResultDTO } from '../types/api';
import { MarkdownRenderer } from '../components/markdown/MarkdownRenderer';
import { CommentSection } from '../components/comment/CommentSection';

const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blog, setBlog] = useState<BlogDetailVO | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const { openAuthModal } = useAuthModal();

  const blogData = blog || {} as BlogDetailVO;

  useEffect(() => {
    const fetchBlogDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.blog.getDetail(Number(id));
        setBlog(response);
        setLikeCount(response.likeCount || 0);
        setIsLiked(response.isLiked || false);
        
        api.admin.trackVisit(`/blog/${id}`).catch(err =>
          console.warn('记录博客访问失败:', err)
        );
      } catch (err: any) {
        console.error('获取文章详情失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetail();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      openAuthModal();
      return;
    }
    if (!blog || isLiking) return;

    try {
      setIsLiking(true);
      const result: LikeResultDTO = await api.blog.toggleLikeWithDetails(blog.id);
      setIsLiked(result.isLiked);
      setLikeCount(result.likeCount);
      if (blog) {
        setBlog({
          ...blog,
          likeCount: result.likeCount,
          viewCount: result.viewCount,
          isLiked: result.isLiked
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blogData.title,
          text: blogData.summary,
          url: window.location.href,
        });
      } catch (error) {}
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold mb-2">文章不存在</h2>
        <Button onClick={() => navigate('/')}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Article Header */}
      <div className="bg-slate-50 border-b border-slate-100 py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="default">{blogData.categoryName || '未分类'}</Badge>
            <span className="text-slate-400">|</span>
            <span className="text-slate-500 text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {blogData.publishTime ? new Date(blogData.publishTime).toLocaleDateString('zh-CN') : '未知日期'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
            {blogData.title}
          </h1>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
                {(blogData.authorName || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900">{blogData.authorName || 'Unknown'}</div>
                <div className="text-sm text-slate-500 flex items-center gap-2">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.ceil((blogData.content?.length || 0) / 500)} min read</span>
                  <span>·</span>
                  <span>{blogData.viewCount} views</span>
                </div>
              </div>
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
              <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center" onClick={handleShare}>
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_250px] gap-12">
        {/* Main Content */}
        <article className="prose prose-lg prose-indigo max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-img:rounded-2xl prose-img:shadow-xl">
          {blogData.coverImg && (
            <img 
              src={blogData.coverImg} 
              alt={blogData.title} 
              className="w-full aspect-video object-cover mb-10 rounded-2xl"
            />
          )}
          
          {blogData.content ? (
            <MarkdownRenderer content={blogData.content} />
          ) : (
            <p className="text-slate-500">暂无内容</p>
          )}
        </article>

        {/* Sidebar */}
        <aside className="hidden md:block space-y-8 sticky top-24 h-fit">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">目录</h3>
            {/* TODO: Implement dynamic TOC based on markdown content */}
            <p className="text-sm text-slate-500">目录生成功能开发中...</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-500/30">
            <h3 className="font-bold text-lg mb-2">订阅更新</h3>
            <p className="text-indigo-100 text-sm mb-4">每周精选技术文章，直接发送到你的邮箱。</p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <Button className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 border-none">
                订阅
              </Button>
            </div>
          </div>
        </aside>
      </div>

      {/* Comments Section */}
      <div className="container mx-auto px-4 max-w-4xl pb-20">
        <div className="border-t border-slate-100 pt-10">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" /> 评论 ({blogData.commentCount || 0})
          </h3>
          <CommentSection blogId={blog.id} />
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;