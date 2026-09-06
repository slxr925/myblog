import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock } from 'lucide-react';
import type { BlogPost } from '../types/api';
import { getPublicBlogPath } from '../utils/blogLinks';
import ArticleCover from './ArticleCover';

interface BlogCardProps { post: BlogPost; }

const BlogCard = memo(({ post }: BlogCardProps) => (
  <article className="group self-start border border-border bg-card">
    <Link to={getPublicBlogPath(post)} className="reading-link flex flex-col">
      <ArticleCover src={post.image} category={post.categoryName} className="h-52 border-b border-border sm:h-64 lg:h-80" />
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="section-kicker">{post.featured ? '置顶文章' : '最新发布'}</span>
          <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-accent transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <h3 className="article-title mb-3 text-2xl font-semibold group-hover:text-accent sm:text-3xl">{post.title}</h3>
        <p className="mb-6 line-clamp-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>{post.author}</span><span>{post.date}</span>
          <span className="inline-flex items-center gap-1"><Clock aria-hidden="true" className="h-3 w-3" />{post.readTime}</span>
        </div>
      </div>
    </Link>
  </article>
));
BlogCard.displayName = 'BlogCard';
export default BlogCard;
