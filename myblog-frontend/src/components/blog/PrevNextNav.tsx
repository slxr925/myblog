import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import type { BlogDetailVO } from '../../types/api';

interface PrevNextNavProps {
  previousBlog?: BlogDetailVO | null;
  nextBlog?: BlogDetailVO | null;
  onNavigate: (blog: BlogDetailVO) => void;
}

const formatPublishDate = (date?: string): string => {
  if (!date) {
    return '未知日期';
  }
  return new Date(date).toLocaleDateString('zh-CN');
};

const NavCard: React.FC<{
  blog: BlogDetailVO;
  type: 'previous' | 'next';
  onNavigate: (blog: BlogDetailVO) => void;
}> = ({ blog, type, onNavigate }) => {
  const isPrevious = type === 'previous';

  return (
    <button
      type="button"
      onClick={() => onNavigate(blog)}
      className="group w-full border border-border rounded-sm bg-card p-4 text-left hover:border-accent/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-3">
        {isPrevious ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span>{isPrevious ? '上一篇' : '下一篇'}</span>
      </div>
      <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors mb-3">
        {blog.title}
      </h4>
      <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono-display uppercase tracking-wider">
        <Calendar className="w-3.5 h-3.5" />
        <span>{formatPublishDate(blog.publishTime)}</span>
      </div>
    </button>
  );
};

const EmptyNavCard: React.FC<{ type: 'previous' | 'next' }> = ({ type }) => {
  const isPrevious = type === 'previous';

  return (
    <div className="w-full border border-border rounded-sm bg-card/60 p-4 text-left opacity-70">
      <div className="flex items-center gap-2 text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-3">
        {isPrevious ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <span>{isPrevious ? '上一篇' : '下一篇'}</span>
      </div>
      <p className="text-sm text-muted-foreground">{isPrevious ? '暂无上一篇' : '暂无下一篇'}</p>
    </div>
  );
};

const PrevNextNav: React.FC<PrevNextNavProps> = ({ previousBlog, nextBlog, onNavigate }) => {
  return (
    <section className="border-t border-border pt-8 mt-8">
      <h3 className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-4">
        阅读导航
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previousBlog ? (
          <NavCard blog={previousBlog} type="previous" onNavigate={onNavigate} />
        ) : (
          <EmptyNavCard type="previous" />
        )}

        {nextBlog ? (
          <NavCard blog={nextBlog} type="next" onNavigate={onNavigate} />
        ) : (
          <EmptyNavCard type="next" />
        )}
      </div>
    </section>
  );
};

export default React.memo(PrevNextNav);
