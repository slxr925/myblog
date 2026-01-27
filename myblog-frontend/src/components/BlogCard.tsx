import { memo } from 'react';
import { Clock, Heart, MessageCircle, ArrowUpRight } from 'lucide-react';
import type { BlogPost } from '../types/api';

interface BlogCardProps {
  post: BlogPost;
  index: number;
  onClick: (postId: number | string) => void;
}

// Editorial-style blog card component
const BlogCard = memo(({ post, index, onClick }: BlogCardProps) => {
  const handleClick = () => {
    onClick(post.id);
  };

  return (
    <article
      onClick={handleClick}
      className="group relative bg-card border border-border hover:border-accent/50 transition-all duration-500 flex flex-col h-full cursor-pointer overflow-hidden"
    >
      {/* Decorative corner accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image with editorial treatment */}
      <div className="relative h-64 overflow-hidden border-b border-border">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
          loading="lazy"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" />

        {/* Editorial label overlay */}
        {post.tags.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card to-transparent">
            <div className="flex gap-2">
              {post.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-background/90 backdrop-blur text-xs font-mono-display uppercase tracking-wider text-accent border border-accent/30"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1 relative">
        {/* Meta information - editorial style */}
        <div className="flex items-center gap-4 text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-4">
          <span>{post.date}</span>
          <span className="w-px h-px bg-border" />
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Title with hover effect */}
        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-accent transition-colors duration-300 line-clamp-2 leading-tight">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 flex-1 font-light">
          {post.excerpt}
        </p>

        {/* Footer */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted flex items-center justify-center text-foreground font-bold text-sm font-mono-display">
                {post.author.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{post.author}</span>
            </div>

            {/* Stats + Arrow */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-mono-display uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {post.likes}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {post.comments}
                </span>
              </div>
              <ArrowUpRight className="w-5 h-5 text-accent transform -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Hover border accent */}
      <div className="absolute bottom-0 left-0 h-px bg-accent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </article>
  );
});

BlogCard.displayName = 'BlogCard';

export default BlogCard;