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
import { CollectionFolderDTO, CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';

interface CreateFolderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (folder: CollectionFolderVO) => void;
}

const CreateFolderForm: React.FC<CreateFolderFormProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CollectionFolderDTO>({
    name: '',
    description: '',
    sortOrder: 0
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('请输入收藏夹名称');
      return;
    }

    if (formData.name.length > 50) {
      toast.error('收藏夹名称不能超过50个字符');
      return;
    }

    setLoading(true);
    try {
      const newFolder = await api.collection.createFolder(formData);
      toast.success('收藏夹创建成功');
      onSuccess(newFolder);
      setFormData({ name: '', description: '', sortOrder: 0 });
    } catch (error: any) {
      console.error('创建收藏夹失败:', error);
      toast.error(error.message || '创建失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '', sortOrder: 0 });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>创建收藏夹</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">收藏夹名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入收藏夹名称"
              maxLength={50}
              disabled={loading}
              required
            />
            <div className="text-xs text-muted-foreground text-right">
              {formData.name.length}/50
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="添加收藏夹描述..."
              maxLength={255}
              rows={3}
              disabled={loading}
            />
            <div className="text-xs text-muted-foreground text-right">
              {(formData.description || '').length}/255
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
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

export default CreateFolderForm;