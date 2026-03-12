import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { api } from '../../utils/api';
import { CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';

interface FolderCreateFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (folder: CollectionFolderVO) => void;
}

const FolderCreateForm: React.FC<FolderCreateFormProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入收藏夹名称');
      return;
    }

    setLoading(true);
    try {
      const newFolder = await api.collection.createFolder(formData);
      toast.success('创建成功');
      onSuccess(newFolder);
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      console.error('创建收藏夹失败:', error);
      toast.error(error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setFormData(prev => ({ ...prev, name: value }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 255) {
      setFormData(prev => ({ ...prev, description: value }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建收藏夹</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              收藏夹名称 <span className="text-accent">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="请输入收藏夹名称"
              maxLength={50}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.name.length}/50
            </p>
          </div>

          <div>
            <Label htmlFor="description">
              描述（可选）
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="添加收藏夹描述..."
              maxLength={255}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.description.length}/255
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FolderCreateForm;
