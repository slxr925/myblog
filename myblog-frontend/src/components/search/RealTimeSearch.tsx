import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { api } from '../../utils/api';

interface SearchSuggestion {
  id: number;
  title: string;
  summary: string;
  categoryName: string;
  tags: string[];
  highlightedTitle?: string;
  highlightedSummary?: string;
}

interface RealTimeSearchProps {
  onSearchTermChange?: (term: string) => void;
  placeholder?: string;
  className?: string;
}

const RealTimeSearch: React.FC<RealTimeSearchProps> = ({
  onSearchTermChange,
  placeholder = "搜索文章...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 防抖函数
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // 更新下拉框位置
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  // 当下拉框打开或窗口调整大小时更新位置
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, suggestions]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', updateDropdownPosition);
      window.addEventListener('scroll', updateDropdownPosition, true);
      return () => {
        window.removeEventListener('resize', updateDropdownPosition);
        window.removeEventListener('scroll', updateDropdownPosition, true);
      };
    }
  }, [isOpen]);

  // 搜索建议
  const fetchSuggestions = debounce(async (term: string) => {
    if (term.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.search.searchBlogs(term, 8);
      const searchData = response?.content ?? [];

      const formattedSuggestions = searchData.map((doc: any) => {
        // 处理tags：可能是字符串数组或对象数组
        const rawTags = Array.isArray(doc.tags) ? doc.tags : (doc.tagNames || []); // SearchResultVO uses tagNames
        const parsedTags = rawTags.map((tag: any) => {
          if (typeof tag === 'string') return tag;
          if (tag && typeof tag === 'object' && 'name' in tag) return tag.name;
          return '';
        }).filter(Boolean);

        const numericId = Number(doc.id);
        return {
          id: Number.isNaN(numericId) ? doc.id : numericId,
          title: doc.title,
          summary: doc.summary,
          categoryName: doc.categoryName,
          tags: parsedTags,
          highlightedTitle: doc.highlightedTitle,
          highlightedSummary: doc.highlightedSummary,
          highlightedContent: doc.highlightedContent
        };
      });

      setSuggestions(formattedSuggestions);
      setIsOpen(true);
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, 300);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    onSearchTermChange?.(value);

    if (value.trim()) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    navigate(`/blog/${suggestion.id}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  // 处理表单提交
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchSubmit();
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          className="w-64 md:w-80 pl-3 pr-10 py-2 bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg transition-colors duration-300"
        />

        {/* 清除按钮 */}
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setIsOpen(false);
              onSearchTermChange?.('');
            }}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <span className="w-3 h-3 flex items-center justify-center text-xs">✕</span>
          </button>
        )}

        {/* 搜索图标 - 移到右侧 */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center pointer-events-none">
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </form>

      {/* 搜索建议下拉框 - 使用 Portal 渲染到 body */}
      {isOpen && suggestions.length > 0 && createPortal(
        <div style={dropdownStyle} className="bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left p-3 rounded-md transition-colors duration-200 [&>*]:pointer-events-none ${index === selectedIndex
                  ? 'bg-accent text-foreground'
                  : 'hover:bg-muted text-foreground'
                  }`}
              >
                <div className="space-y-2">
                  {/* 标题 */}
                  <div className="flex items-center justify-between">
                    <h4
                      className="font-medium text-sm line-clamp-1 flex-1 pointer-events-none"
                      dangerouslySetInnerHTML={{ __html: suggestion.highlightedTitle || suggestion.title }}
                    />
                    <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>

                  {/* 摘要 */}
                  <p
                    className="text-xs text-muted-foreground line-clamp-2 pointer-events-none"
                    dangerouslySetInnerHTML={{
                      __html: (suggestion.highlightedSummary && suggestion.highlightedSummary.includes('search-highlight'))
                        ? suggestion.highlightedSummary
                        : (suggestion.highlightedContent && suggestion.highlightedContent.includes('search-highlight'))
                          ? suggestion.highlightedContent
                          : suggestion.summary
                    }}
                  />

                  {/* 分类和标签 */}
                  <div className="flex items-center gap-2 text-xs">
                    {suggestion.categoryName && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {suggestion.categoryName}
                      </span>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {suggestion.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {suggestion.tags.length > 3 && (
                        <span className="text-muted-foreground">
                          +{suggestion.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 查看更多结果 */}
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="w-full text-left p-2 text-sm text-primary hover:text-primary/80 transition-colors duration-200"
            >
              查看更多关于 "{searchTerm}" 的搜索结果
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RealTimeSearch;