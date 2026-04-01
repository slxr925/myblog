import React from 'react';
import { Calendar } from 'lucide-react';
import type { BlogRecommendationVO } from '../../types/api';

type EmptyBehavior = 'hide' | 'showEmpty';

interface RecommendListProps {
  title: string;
  items: BlogRecommendationVO[];
  onNavigate: (item: BlogRecommendationVO) => void;
  emptyBehavior?: EmptyBehavior;
}

const formatPublishDate = (date?: string): string => {
  if (!date) {
    return '未知日期';
  }
  return new Date(date).toLocaleDateString('zh-CN');
};

const RecommendList: React.FC<RecommendListProps> = ({
  title,
  items,
  onNavigate,
  emptyBehavior = 'showEmpty',
}) => {
  if (items.length === 0 && emptyBehavior === 'hide') {
    return null;
  }

  return (
    <section className="border border-border rounded-sm bg-card p-4">
      <h3 className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h3>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无推荐</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item)}
              className="w-full text-left border border-border/60 rounded-sm p-3 hover:border-accent/50 transition-colors"
            >
              <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-2 hover:text-accent transition-colors">
                {item.title}
              </h4>
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground font-mono-display uppercase tracking-wider">
                <span className="flex items-center gap-1 min-w-0">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{formatPublishDate(item.publishTime)}</span>
                </span>
                <span className="truncate">{item.categoryName || '未分类'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default React.memo(RecommendList);
