import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText } from 'lucide-react';

import BlogListItem from '../components/BlogListItem';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  image: string;
  featured: boolean;
  categoryId: number;
  categoryName: string;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        setLoading(true);
        const response = await api.blog.getLatest(50);
        const blogData = Array.isArray(response) ? response : [];

        const formattedPosts = blogData.map((blog: any) => {
          let publishDate = '';
          if (blog.publishTime) {
            try {
              const dateObj = Array.isArray(blog.publishTime)
                ? new Date(blog.publishTime[0], blog.publishTime[1] - 1, blog.publishTime[2])
                : new Date(blog.publishTime);
              publishDate = dateObj.toLocaleDateString('zh-CN');
            } catch (e) { publishDate = '未知日期'; }
          }

          const tags = blog.tags ? blog.tags.map((tag: any) =>
            (typeof tag === 'string' ? tag : tag.name) || ''
          ).filter(Boolean) : [];

          return {
            id: blog.id,
            title: blog.title,
            excerpt: blog.summary || '',
            content: blog.content || '',
            author: blog.authorName || '未知作者',
            date: publishDate,
            readTime: `${Math.ceil((blog.content?.length || 0) / 500)} min`,
            views: blog.viewCount || 0,
            likes: blog.likeCount || 0,
            comments: blog.commentCount || 0,
            tags: tags,
            image: blog.coverImg || `https://picsum.photos/seed/blog${blog.id}/800/400.jpg`,
            featured: blog.isTop === 1,
            categoryId: blog.categoryId,
            categoryName: blog.categoryName,
          };
        });

        setPosts(formattedPosts);
      } catch (error) {
        console.error('获取文章失败:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, [isAuthenticated]);

  const filteredPosts = selectedCategory
    ? posts.filter(post => post.categoryName === selectedCategory)
    : posts;

  const allCategories = Array.from(new Set(posts.map(post => post.categoryName))).filter(Boolean);

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">全部文章</h1>
          </div>
          <p className="text-muted-foreground text-lg">探索所有技术分享、项目实战和学习心得</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            全部
          </Button>
          {allCategories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* List Layout */}
        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-52 bg-card rounded-3xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredPosts.map((post, index) => (
              <BlogListItem
                key={post.id}
                post={post}
                index={index}
                onClick={() => navigate(`/blog/${post.id}`)}
              />
            ))}
          </div>
        )}

        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">没有找到相关文章</p>
            {selectedCategory && (
              <Button variant="link" onClick={() => setSelectedCategory(null)} className="mt-2">
                查看全部文章
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;