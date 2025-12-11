import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, FolderPlus } from 'lucide-react';
import { api } from '../../utils/api';
import { CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';
import CreateFolderForm from './CreateFolderForm';
import { eventEmitter, EVENTS } from '../../utils/events';

interface FolderSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folderId: number) => void;
  showCreateNew?: boolean;
}

const FolderSelectDialog: React.FC<FolderSelectDialogProps> = ({
  open,
  onClose,
  onSelect,
  showCreateNew = true
}) => {
  const [folders, setFolders] = useState<CollectionFolderVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (open) {
      loadFolders();
    }
  }, [open]);

  // Listen for folder data changes to refresh when dialog is open
  useEffect(() => {
    const handleFolderDataChanged = () => {
      if (open) {
        loadFolders();
      }
    };

    eventEmitter.on(EVENTS.FOLDER_DATA_CHANGED, handleFolderDataChanged);

    return () => {
      eventEmitter.off(EVENTS.FOLDER_DATA_CHANGED, handleFolderDataChanged);
    };
  }, [open]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await api.collection.getFolders();
      setFolders(data);
    } catch (error) {
      console.error('加载收藏夹失败:', error);
      toast.error('加载收藏夹失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (folderId: number) => {
    onSelect(folderId);
  };

  const handleFolderCreated = (newFolder: CollectionFolderVO) => {
    setFolders(prev => [...prev, newFolder]);
    setShowCreateForm(false);
    onSelect(newFolder.id);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>选择收藏夹</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无收藏夹，请先创建
              </div>
            ) : (
              folders.map(folder => (
                <Button
                  key={folder.id}
                  variant="ghost"
                  className="w-full justify-between h-auto p-3"
                  onClick={() => handleSelect(folder.id)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{folder.name}</span>
                    {folder.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        默认
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {folder.collectionCount || 0}
                  </span>
                </Button>
              ))
            )}

            {showCreateNew && (
              <Button
                variant="ghost"
                className="w-full justify-center text-primary h-12"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建新收藏夹
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CreateFolderForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleFolderCreated}
      />
    </>
  );
};

export default FolderSelectDialog;