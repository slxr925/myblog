import { useState } from 'react';

interface ArticleCoverProps {
  src?: string;
  category?: string;
  className?: string;
}

export default function ArticleCover({ src, category, className = '' }: ArticleCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string>();
  const hasImage = src && src !== failedSrc;

  return (
    <div aria-hidden="true" className={`article-cover relative overflow-hidden ${className}`}>
      {hasImage ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      ) : (
        <div className="flex h-full flex-col justify-between p-6 sm:p-8">
          <span className="font-mono-display text-[10px] tracking-[.2em] text-muted-foreground">RYAN’S FIELD NOTES</span>
          <span className="font-mono-display text-5xl text-accent/60">{'{ / }'}</span>
          <span className="text-sm text-muted-foreground">{category || '代码 · 实践 · 思考'}</span>
        </div>
      )}
    </div>
  );
}
