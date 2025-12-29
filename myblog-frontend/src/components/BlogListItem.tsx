import { memo } from 'react';
import { Calendar, Clock, Heart, MessageCircle } from 'lucide-react';
import type { BlogPost } from '../types/api';

interface BlogListItemProps {
    post: BlogPost;
    index: number;
    onClick: (postId: number | string) => void;
}

const BlogListItem = memo(({ post, index, onClick }: BlogListItemProps) => {
    const handleClick = () => {
        onClick(post.id);
    };

    return (
        <div
            onClick={handleClick}
            className="group bg-card rounded-3xl overflow-hidden border border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col md:flex-row h-full md:h-52 cursor-pointer mb-6"
        >
            {/* Image Section - Stacked on mobile, Left side on desktop */}
            <div className="relative w-full md:w-72 h-48 md:h-full shrink-0 overflow-hidden">
                <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                    {post.tags.slice(0, 1).map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-white/90 backdrop-blur-md text-xs font-semibold text-indigo-600 rounded-full shadow-sm">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 p-5 md:p-6 justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{post.date}</span>
                        </div>
                        <span className="hidden md:inline w-1 h-1 bg-border rounded-full" />
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1 md:line-clamp-1">
                        {post.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 md:line-clamp-2">
                        {post.excerpt}
                    </p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                            {post.author.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs md:text-sm font-medium text-foreground">{post.author}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs md:text-sm">
                        <span className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" /> {post.comments}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

BlogListItem.displayName = 'BlogListItem';

export default BlogListItem;
