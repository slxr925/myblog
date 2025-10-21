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
  onCategorySelect?: (categoryId: number) => void;
  onTagSelect?: (tagName: string) => void;
  selectedCategory?: number;
  selectedTag?: string;
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

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  const fetchCategoriesAndTags = async () => {
    try {
      setLoading(true);

      // 并行获取分类和标签数据
      const [categoriesResponse, tagsResponse] = await Promise.all([
        api.category.getAll(), // 获取所有分类
        api.tag.getUsedTags() // 获取所有被使用的标签
      ]);

      // 处理分类数据
      if (categoriesResponse && Array.isArray(categoriesResponse)) {
        const formattedCategories = categoriesResponse.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          blogCount: 0 // 可以后续通过API获取每个分类的文章数量
        }));
        setCategories(formattedCategories);
      }

      // 处理标签数据
      if (tagsResponse && Array.isArray(tagsResponse)) {
        setTags(tagsResponse);
      }

    } catch (error) {
      console.error('获取分类和标签失败:', error);
      // 出错时设置空数组
      setCategories([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: number) => {
    onCategorySelect?.(categoryId);
  };

  const handleTagClick = (tagName: string) => {
    onTagSelect?.(tagName);
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      {/* 分类部分 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">文章分类</h3>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${
                expanded ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>

        {expanded && (
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                  selectedCategory === category.id
                    ? 'bg-blue-50 text-blue-600 font-medium border-l-3 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{category.name}</span>
                  {category.blogCount && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {category.blogCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 标签部分 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => handleTagClick(tag.name)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                selectedTag === tag.name
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <Hash className="h-3 w-3" />
              {tag.name}
            </button>
          ))}
        </div>
        {tags.length === 0 && (
          <p className="text-sm text-gray-500 italic">暂无标签</p>
        )}
      </div>
    </div>
  );
};

export default CategoryNavigation;