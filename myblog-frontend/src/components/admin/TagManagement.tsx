import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Hash,
  Calendar
} from 'lucide-react';
import { api } from '../../utils/api';
import type { Tag } from '../../types/api';

export const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getTags();

      const tagData = Array.isArray(response)
        ? response
        : Array.isArray(response?.records)
          ? response.records
          : [];

      setTags(tagData);
    } catch (err) {
      setError('获取标签列表失败');
      console.error('获取标签失败:', err);
      setTags([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setError(null);
    setSuccess(null);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '' });
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (tag: Tag) => {
    setIsCreating(false);
    setEditingId(tag.id);
    setFormData({ name: tag.name });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('标签名称不能为空');
      return;
    }

    const existingTag = tags.find(tag =>
      tag.name.toLowerCase() === formData.name.trim().toLowerCase() &&
      tag.id !== editingId
    );

    if (existingTag) {
      setError('标签名称已存在');
      return;
    }

    try {
      setError(null);
      if (isCreating) {
        await api.tag.create({
          name: formData.name.trim()
        });
        setSuccess('标签创建成功');
      } else if (editingId) {
        await api.tag.update({
          id: editingId,
          name: formData.name.trim()
        });
        setSuccess('标签更新成功');
      }

      await fetchTags();
      setTimeout(resetForm, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败');
      console.error('保存标签失败:', err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`确定要删除标签"${name}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      setError(null);
      await api.tag.delete(id);
      setSuccess('标签删除成功');
      await fetchTags();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '删除失败');
      console.error('删除标签失败:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
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
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">标签管理</h2>
            <p className="text-muted-foreground">管理博客标签</p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            新建标签
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Hash className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tags.length}</p>
                  <p className="text-muted-foreground text-sm">总标签数</p>
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
                    {tags.filter(tag => {
                      const createdAt = new Date(tag.createTime);
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
                  <Hash className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {tags.length > 0 ? Math.ceil(tags.length / 10) : 0}
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
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{isCreating ? '新建标签' : '编辑标签'}</span>
                    <Button variant="ghost" size="sm" onClick={resetForm}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">标签名称 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ name: e.target.value })}
                      placeholder="请输入标签名称（如：JavaScript、React等）"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      建议使用简洁明了的标签名称，便于用户搜索和分类
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

        {/* Tags Grid */}
        <div>
          {tags.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无标签</p>
                  <p>点击上方"新建标签"按钮创建第一个标签</p>
                </div>
                <Button onClick={handleCreate} className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  新建标签
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Hash className="w-5 h-5 text-primary flex-shrink-0" />
                          <h3 className="font-semibold text-lg truncate">{tag.name}</h3>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(tag)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>ID: {tag.id}</span>
                          <Badge variant="secondary" className="text-xs">
                            标签
                          </Badge>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(tag.createTime).toLocaleDateString('zh-CN')}
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
