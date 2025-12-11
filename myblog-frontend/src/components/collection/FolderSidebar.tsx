import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { api } from '../../utils/api';
import { CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';
import CreateFolderForm from './CreateFolderForm';

interface FolderSidebarProps {
  activeFolderId?: number;
  onFolderSelect: (folderId: number | undefined) => void;
  onRefresh: () => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({
  activeFolderId,
  onFolderSelect,
  onRefresh
}) => {
  const [folders, setFolders] = useState<CollectionFolderVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

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

  const handleFolderCreated = (newFolder: CollectionFolderVO) => {
    setFolders(prev => [...prev, newFolder]);
    setShowCreateForm(false);
    onFolderSelect(newFolder.id);
    onRefresh();
  };

  const handleDeleteFolder = async (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('确定要删除这个收藏夹吗？其中的收藏将移动到默认收藏夹。')) {
      return;
    }

    try {
      await api.collection.deleteFolder(folderId);
      toast.success('收藏夹删除成功');
      loadFolders();
      if (activeFolderId === folderId) {
        onFolderSelect(undefined);
      }
      onRefresh();
    } catch (error: any) {
      console.error('删除收藏夹失败:', error);
      toast.error(error.message || '删除失败');
    }
  };

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">我的收藏夹</h2>
            <Button
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1"
            >
              <FolderPlus className="w-4 h-4" />
              <span>新建</span>
            </Button>
          </div>
        </div>

        {/* 文件夹列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* 全部收藏 */}
              <Button
                variant={activeFolderId === undefined ? "secondary" : "ghost"}
                className="w-full justify-start mb-2"
                onClick={() => onFolderSelect(undefined)}
              >
                <Folder className="w-4 h-4 mr-2" />
                <span className="flex-1 text-left">全部收藏</span>
              </Button>

              {/* 文件夹列表 */}
              {folders.map(folder => (
                <div key={folder.id} className="relative group">
                  <Button
                    variant={activeFolderId === folder.id ? "secondary" : "ghost"}
                    className="w-full justify-start mb-1 pr-8"
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <Folder className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <div className="flex items-center space-x-2">
                      {folder.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          默认
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {folder.collectionCount || 0}
                      </span>
                    </div>
                  </Button>

                  {/* 操作菜单 */}
                  {!folder.isDefault && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: 打开编辑对话框
                              toast.info('编辑功能开发中');
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <CreateFolderForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleFolderCreated}
      />
    </>
  );
};

export default FolderSidebar;