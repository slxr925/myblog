import React, { useState, useEffect } from 'react';
import { ChevronRight, Hash } from 'lucide-react';
import { api } from '../../utils/api';

interface Category {
  id: number;
  name: string;
  description?: string;
  blogCount?: number;
}

interface Tag {
  id: number;
  name: string;
  createTime: string;
}

interface CategoryNavigationProps {
  onCategorySelect?: (categoryId: number | null) => void;
  onTagSelect?: (tagName: string | null) => void;
  selectedCategory?: number | null;
  selectedTag?: string | null;
}

const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  onCategorySelect,
  onTagSelect,
  selectedCategory,
  selectedTag
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [categoriesResponse, tagsResponse] = await Promise.all([
        api.category.getAll(),
        api.tag.getUsedTags()
      ]);

      const formattedCategories = categoriesResponse.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        blogCount: category.blogCount ?? 0
      }));
      setCategories(formattedCategories);
      setTags(tagsResponse);

    } catch (error) {
      console.error('获取分类和标签失败:', error);
      setCategories([]);
      setTags([]);
      setErrorMessage('分类或标签加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    const nextValue = selectedCategory === categoryId ? null : categoryId;
    onCategorySelect?.(nextValue);
  };

  const handleTagClick = (tagName: string) => {
    const nextValue = selectedTag === tagName ? null : tagName;
    onTagSelect?.(nextValue);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border bg-card p-4 space-y-6">
      {/* 分类部分 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-mono-display uppercase tracking-wider text-foreground">文章分类</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {expanded && (
          <div className="space-y-1">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1">暂无分类</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`w-full text-left px-3 py-2 border-l-2 transition-all duration-200 text-sm ${
                    selectedCategory === category.id
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.name}</span>
                    {typeof category.blogCount === 'number' && (
                      <span className="text-xs font-mono-display uppercase tracking-wider text-muted-foreground bg-muted/30 px-2 py-0.5">
                        {category.blogCount}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* 标签部分 */}
      <div>
        <h3 className="text-sm font-mono-display uppercase tracking-wider text-foreground mb-4">热门标签</h3>
        {errorMessage && (
          <p className="text-sm text-destructive mb-2">{errorMessage}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-mono-display uppercase tracking-wider transition-all duration-200 border ${
                selectedTag === tag.name
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground'
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag.name}
            </button>
          ))}
        </div>
        {tags.length === 0 && (
          <p className="text-sm text-muted-foreground">暂无标签</p>
        )}
      </div>
    </div>
  );
};

export default CategoryNavigation;
