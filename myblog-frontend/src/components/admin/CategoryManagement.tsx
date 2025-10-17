import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  Calendar,
  FileText
} from 'lucide-react';
import { api } from '../../utils/api';
import type { Category } from '../../types/api';

interface CategoryManagementProps {
  onBack: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.category.getAll();
      console.log('API返回的分类数据:', response.data);

      // 处理不同的数据结构
      let categoryData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          categoryData = response.data;
        } else if (response.data.records && Array.isArray(response.data.records)) {
          categoryData = response.data.records;
        }
      }

      console.log('处理后的分类数据:', categoryData);
      setCategories(categoryData);
    } catch (err) {
      setError('获取分类列表失败');
      console.error('获取分类失败:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setError(null);
    setSuccess(null);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (category: Category) => {
    setIsCreating(false);
    setEditingId(category.id);
    setFormData({
      name: category.name || '',
      description: category.description || ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('分类名称不能为空');
      return;
    }

    // 检查重名
    const existingCategory = categories.find(
      cat => cat.name === formData.name.trim() &&
      cat.id !== editingId
    );

    if (existingCategory) {
      setError('分类名称已存在');
      return;
    }

    try {
      setError(null);
      if (isCreating) {
        await api.category.create({
          name: formData.name.trim(),
          description: formData.description.trim()
        });
        setSuccess('分类创建成功');
      } else if (editingId) {
        await api.category.update({
          id: editingId,
          name: formData.name.trim(),
          description: formData.description.trim()
        });
        setSuccess('分类更新成功');
      }

      await fetchCategories();
      setTimeout(resetForm, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
      console.error('保存分类失败:', err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除分类"${name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setError(null);
      await api.category.delete(id);
      setSuccess('分类删除成功');
      await fetchCategories();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
      console.error('删除分类失败:', err);
    }
  };

  if (loading) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回控制台
            </Button>
            <div>
              <h1 className="text-3xl font-bold">分类管理</h1>
              <p className="text-muted-foreground">管理博客分类</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建分类
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-muted-foreground text-sm">总分类数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {categories.filter(cat => {
                      const createdAt = new Date(cat.createTime || '');
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                      return createdAt >= thirtyDaysAgo;
                    }).length}
                  </p>
                  <p className="text-muted-foreground text-sm">近30天新增</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {categories.length > 0 ? Math.ceil(categories.length / 10) : 0}
                  </p>
                  <p className="text-muted-foreground text-sm">页数 (10/页)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{error}</span>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-700">{success}</span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {(isCreating || editingId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isCreating ? '新建分类' : '编辑分类'}</span>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">分类名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入分类名称（如：技术分享、项目实战等）"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      建议使用简洁明了的分类名称，便于用户理解内容分类
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">分类描述</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="请输入分类描述（可选）"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground">
                      详细描述该分类包含的内容类型，帮助用户更好地了解分类
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      保存
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      取消
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Grid */}
        <div className="grid gap-6">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无分类</p>
                  <p>点击上方"新建分类"按钮创建第一个分类</p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  新建分类
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FolderOpen className="w-5 h-5 text-primary flex-shrink-0" />
                          <h3 className="font-semibold text-lg truncate">{category.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category.id, category.name)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {category.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {category.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>ID: {category.id}</span>
                          <Badge variant="secondary" className="text-xs">
                            分类
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {category.createTime ? new Date(category.createTime).toLocaleDateString('zh-CN') : '未知'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};