import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Heart, MessageCircle } from 'lucide-react';
import type { BlogPost } from '../types/api';

interface BlogCardProps {
  post: BlogPost;
  index: number;
  onClick: (postId: number | string) => void;
}

// 优化的文章卡片组件，使用React.memo防止不必要的重渲染
const BlogCard = memo(({ post, index, onClick }: BlogCardProps) => {
  const handleClick = () => {
    onClick(post.id);
  };

  return (
    <motion.div
      key={post.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleClick}
      className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full cursor-pointer"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} className="px-3 py-1 bg-white/90 backdrop-blur-md text-xs font-semibold text-indigo-600 rounded-full shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Calendar className="w-4 h-4" />
          <span>{post.date}</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <Clock className="w-4 h-4 ml-1" />
          <span>{post.readTime}</span>
        </div>

        <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3 flex-1">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {post.author.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground">{post.author}</span>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1">
              <Heart className="w-4 h-4" /> {post.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-4 h-4" /> {post.comments}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

BlogCard.displayName = 'BlogCard';

export default BlogCard;