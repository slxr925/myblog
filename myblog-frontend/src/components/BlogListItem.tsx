import { memo } from 'react';
import { Link } from 'react-router-dom';
import { getPublicBlogPath } from '../utils/blogLinks';
import ArticleCover from './ArticleCover';
import { Calendar, Clock, Heart, MessageCircle } from 'lucide-react';
import type { BlogPost } from '../types/api';

interface BlogListItemProps {
    post: BlogPost;
    compact?: boolean;
}

const escapeHtml = (input: string): string => {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const sanitizeHighlightHtml = (raw: string): string => {
    const escaped = escapeHtml(raw || '');
    return escaped
        .replace(/&lt;(?:span|mark)\s+class=['"]search-highlight['"]&gt;/gi, '<span class="search-highlight">')
        .replace(/&lt;\/(?:span|mark)&gt;/gi, '</span>');
};

const BlogListItem = memo(({ post, compact = false }: BlogListItemProps) => {
    const safeHighlightedTitle = post.highlightedTitle ? sanitizeHighlightHtml(post.highlightedTitle) : '';
    const safeHighlightedExcerpt = post.highlightedExcerpt ? sanitizeHighlightHtml(post.highlightedExcerpt) : '';

    return (
        <Link
            to={getPublicBlogPath(post)}
            className="reading-link group flex min-w-0 gap-5 border-b border-border py-6 first:pt-0 last:border-b-0"
        >
            {!compact && <ArticleCover src={post.image} category={post.categoryName} className="hidden min-h-36 w-48 shrink-0 self-stretch sm:block lg:w-56" />}

            {/* Content Section */}
            <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{post.date}</span>
                        </div>
                        <span className="w-px h-px bg-border" />
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 group-hover:text-accent transition-colors line-clamp-2 article-title">
                        {safeHighlightedTitle ? (
                            <span dangerouslySetInnerHTML={{ __html: safeHighlightedTitle }} />
                        ) : (
                            post.title
                        )}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 md:line-clamp-2 font-normal">
                        {safeHighlightedExcerpt ? (
                            <span dangerouslySetInnerHTML={{ __html: safeHighlightedExcerpt }} />
                        ) : (
                            post.excerpt
                        )}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-4 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted flex items-center justify-center text-foreground font-bold text-[10px] font-mono-display">
                            {post.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">{post.author}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span aria-label={`${post.likes} 次点赞`} className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> {post.likes}
                        </span>
                        <span aria-label={`${post.comments} 条评论`} className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" /> {post.comments}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
});

BlogListItem.displayName = 'BlogListItem';

export default BlogListItem;
