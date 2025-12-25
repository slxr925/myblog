import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Save, Eye, ArrowLeft, Upload, ClipboardList, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../../utils/api';
import type { BlogDetailVO, Category, Tag } from '../../types/api';
import { BlogStatus } from '../../types/api';

interface BlogEditorProps {
  mode?: 'create' | 'edit';
}

interface BlogFormData {
  title: string;
  summary: string;
  content: string;
  coverImg: string;
  categoryId: number | null;
  tags: string[];
  status: number; // 0-草稿，1-已发布
  visibility: number;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ mode = 'create' }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    summary: '',
    content: '',
    coverImg: '',
    categoryId: null,
    tags: [],
    status: 0, // 默认草稿状态
    visibility: 1,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(mode === 'edit' && id ? Number(id) : null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [drafts, setDrafts] = useState<BlogDetailVO[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotRef = useRef<string>('');

  const buildSnapshot = (data: BlogFormData = formData) => {
    return JSON.stringify({
      title: data.title,
      summary: data.summary,
      content: data.content,
      coverImg: data.coverImg,
      categoryId: data.categoryId,
      tags: data.tags,
      visibility: data.visibility
    });
  };

  const navigateToDrafts = () => {
    navigate('/blog/drafts?status=draft');
  };

  const fetchDrafts = useCallback(async () => {
    try {
      setDraftsLoading(true);
      const result = await api.blog.getDrafts();
      setDrafts(result || []);
    } catch (error) {
      console.error('获取草稿列表失败:', error);
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  // 加载分类和标签数据
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          api.category.getAll(),
          api.tag.getUsedTags()
        ]);
        setCategories(categoriesRes);
        setAvailableTags(tagsRes);
      } catch (error) {
        console.error('加载分类和标签失败:', error);
        toast.error('加载分类和标签失败');
      }
    };

    loadCategoriesAndTags();
    fetchDrafts();
  }, [fetchDrafts]);

  // 加载现有博客数据（编辑模式）
  useEffect(() => {
    if (mode === 'edit' && id) {
      const loadBlog = async () => {
        try {
          setIsLoading(true);
          const blog = await api.blog.getById(Number(id));

          // 获取博客的标签
          const blogTags = await api.tag.getTags(Number(id));

          const nextFormData: BlogFormData = {
            title: blog.title || '',
            summary: blog.summary || '',
            content: blog.content || '',
            coverImg: blog.coverImg || '',
            categoryId: blog.categoryId || null,
            tags: blogTags.map(tag => tag.name),
            status: blog.status ?? BlogStatus.DRAFT,
            visibility: blog.visibility ?? 1
          };
          setFormData(nextFormData);
          setDraftId(Number(id));
          lastSnapshotRef.current = buildSnapshot(nextFormData);
          if (blog.updateTime) {
            setLastSavedAt(new Date(blog.updateTime));
          }
        } catch (error) {
          console.error('加载博客失败:', error);
          toast.error('加载博客失败');
          navigate('/dashboard');
        } finally {
          setIsLoading(false);
        }
      };

      loadBlog();
    }
  }, [mode, id, navigate]);

  // 表单字段更新 - 使用 useCallback 确保函数引用稳定
  const handleInputChange = useCallback((field: keyof BlogFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 标签管理 - 使用 useCallback 并修复依赖
  const addTag = useCallback((tagName: string) => {
    if (!tagName) return;

    setFormData(prev => {
      // 检查标签是否已存在
      if (prev.tags.includes(tagName)) {
        return prev;
      }
      return {
        ...prev,
        tags: [...prev.tags, tagName]
      };
    });
    setTagInput('');
  }, []);

  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  }, []);

  // 图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.upload.uploadEditorImage(file);
      handleInputChange('coverImg', response.data.url);
      toast.success('图片上传成功');
    } catch (error) {
      console.error('图片上传失败:', error);
      toast.error('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const persistBlog = useCallback(
    async (status: number, silent = false): Promise<BlogDetailVO | null> => {
      if ((!formData.title.trim() || !formData.content.trim()) && !silent) {
        toast.error('请完善文章标题和内容');
        return null;
      }

      if (status === BlogStatus.PUBLISHED && !formData.categoryId) {
        if (!silent) {
          toast.error('发布前请选择分类');
        }
        return null;
      }

      const payload = {
        ...formData,
        status
      };

      const targetId = mode === 'edit' ? Number(id) : draftId;
      let savedBlog: BlogDetailVO;

      if (targetId) {
        savedBlog = await api.blog.update(targetId, payload);
      } else {
        savedBlog = await api.blog.create(payload);
        setDraftId(savedBlog.id);
      }

      if (!silent) {
        toast.success(status === BlogStatus.PUBLISHED ? '文章发布成功' : '草稿保存成功');
      }

      setLastSavedAt(new Date());
      lastSnapshotRef.current = buildSnapshot(payload);
      fetchDrafts();
      return savedBlog;
    },
    [formData, draftId, mode, id, fetchDrafts]
  );

  const handleSave = async (status: number) => {
    setFormData(prev => ({ ...prev, status }));
    setIsSaving(true);
    try {
      const savedBlog = await persistBlog(status);
      if (!savedBlog) {
        return;
      }
      if (status === BlogStatus.PUBLISHED) {
        navigate(`/blog/${savedBlog.id}`);
      }
    } catch (error) {
      console.error('保存博客失败:', error);
      const message =
        (error as any)?.response?.data?.message ||
        (error as Error).message ||
        '保存失败，请重试';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoSaveDraft = useCallback(async () => {
    if (!formData.title.trim() && !formData.content.trim()) {
      return;
    }
    if (isSaving || isAutoSaving) {
      return;
    }

    setIsAutoSaving(true);
    try {
      await persistBlog(BlogStatus.DRAFT, true);
    } catch (error) {
      console.error('自动保存草稿失败:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData.title, formData.content, isSaving, isAutoSaving, persistBlog]);

  useEffect(() => {
    const snapshot = buildSnapshot();
    if (!formData.title && !formData.content) {
      return;
    }
    if (snapshot === lastSnapshotRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSaveDraft();
    }, 4000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    formData.title,
    formData.summary,
    formData.content,
    formData.coverImg,
    formData.categoryId,
    formData.tags,
    handleAutoSaveDraft
  ]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);;

  // AI标题生成
  const handleGenerateTitle = async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const result = await api.ai.generateTitle(formData.content);
      handleInputChange('title', result.title);
      toast.success('标题生成成功');
    } catch (error) {
      console.error('标题生成失败:', error);
      toast.error('标题生成失败');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // AI文章润色
  const handlePolishContent = async () => {
    if (!formData.content.trim()) {
      toast.error('请先输入文章内容');
      return;
    }

    setIsPolishing(true);
    try {
      const result = await api.ai.polishContent(formData.content);
      handleInputChange('content', result.polishedContent);
      toast.success('文章润色成功');
    } catch (error) {
      console.error('文章润色失败:', error);
      toast.error('文章润色失败');
    } finally {
      setIsPolishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* 头部操作栏 */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? '写文章' : '编辑文章'}
            </h1>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {isAutoSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                  自动保存中...
                </>
              ) : lastSavedAt ? (
                <>草稿已保存于 {lastSavedAt.toLocaleTimeString('zh-CN', { hour12: false })}</>
              ) : (
                <>尚未自动保存</>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? '编辑' : '预览'}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSave(BlogStatus.DRAFT)}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? '保存中...' : '保存草稿'}
              </Button>

              <Button
                onClick={() => handleSave(BlogStatus.PUBLISHED)}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? '发布中...' : '发布文章'}
              </Button>

              <Button variant="ghost" onClick={navigateToDrafts} className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                草稿箱
              </Button>

              <Button
                variant="outline"
                onClick={handlePolishContent}
                disabled={!formData.content || isPolishing}
                className="flex items-center gap-2"
              >
                {isPolishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    润色中
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    AI润色
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-6">
          草稿会在停止输入后自动保存，并可在右侧“草稿箱”或后台文章管理中查看与继续编辑。
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 主编辑区域 */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>文章内容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 标题 */}
                <div>
                  <Label htmlFor="title">文章标题 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="请输入文章标题"
                      className="text-xl font-bold flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleGenerateTitle}
                      disabled={!formData.content || isGeneratingTitle}
                    >
                      {isGeneratingTitle ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          生成中
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          AI生成
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* 摘要 */}
                <div>
                  <Label htmlFor="summary">文章摘要</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => handleInputChange('summary', e.target.value)}
                    placeholder="请输入文章摘要"
                    className="text-base"
                  />
                </div>

                {/* Markdown编辑器 */}
                <div>
                  <Label>文章内容 *</Label>
                  <div className="mt-2 [&_.w-md-editor-text-input]:text-base [&_.w-md-editor-text-input]:font-normal">
                    <MDEditor
                      value={formData.content}
                      onChange={(value) => handleInputChange('content', value || '')}
                      preview={previewMode ? 'preview' : 'edit'}
                      height={400}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏设置 */}
          <div className="space-y-6">
            {/* 封面图片 */}
            <Card>
              <CardHeader>
                <CardTitle>封面图片</CardTitle>
              </CardHeader>
              <CardContent>
                {formData.coverImg ? (
                  <div className="space-y-4">
                    <img
                      src={formData.coverImg}
                      alt="封面图片"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleInputChange('coverImg', '')}
                      className="w-full"
                    >
                      删除封面
                    </Button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="coverImage"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <label htmlFor="coverImage" className="cursor-pointer">
                      <div className="w-full flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
                        {isUploading ? (
                          '上传中...'
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            上传封面图片
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 分类 */}
            <Card>
              <CardHeader>
                <CardTitle>文章分类</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.categoryId?.toString() || ''}
                  onValueChange={(value) => handleInputChange('categoryId', value ? Number(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 标签 */}
            <Card>
              <CardHeader>
                <CardTitle>文章标签</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="输入标签名称"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                    />
                    <Button
                      onClick={() => addTag(tagInput)}
                      disabled={!tagInput.trim()}
                    >
                      添加
                    </Button>
                  </div>

                  {/* 已选择的标签 */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 推荐标签 */}
                  {availableTags.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">推荐标签：</p>
                      <div className="flex flex-wrap gap-2">
                        {availableTags
                          .filter(tag => !formData.tags.includes(tag.name))
                          .slice(0, 8)
                          .map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => addTag(tag.name)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 可见性 */}
            <Card>
              <CardHeader>
                <CardTitle>可见性</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.visibility.toString()}
                  onValueChange={(value) => handleInputChange('visibility', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">公开</SelectItem>
                    <SelectItem value="0">仅自己可见</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* 草稿箱 */}
            <Card>
              <CardHeader>
                <CardTitle>草稿箱</CardTitle>
                <CardDescription>最近保存的草稿</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {draftsLoading ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前没有草稿，开始创作吧！</p>
                ) : (
                  <div className="space-y-3">
                    {drafts.slice(0, 5).map((draft) => (
                      <div key={draft.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">
                            {draft.title || '无标题草稿'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            更新于 {draft.updateTime ? new Date(draft.updateTime).toLocaleString('zh-CN', { hour12: false }) : '--'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/blog/edit/${draft.id}`)}
                        >
                          编辑
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={navigateToDrafts}
                >
                  查看全部草稿
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BlogEditor;