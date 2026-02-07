import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  FolderOpen,
  BookOpen,
  Plus,
  Share2,
  Link as LinkIcon,
  Check,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { api } from '../../utils/api';
import { UserCollectionVO, CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';
import FolderCreateForm from './FolderCreateForm';
import { eventEmitter, EVENTS } from '../../utils/events';

interface CollectionsManagerProps {
  className?: string;
}

const CollectionsManager: React.FC<CollectionsManagerProps> = ({ className }) => {
  const [collections, setCollections] = useState<UserCollectionVO[]>([]);
  const [folders, setFolders] = useState<CollectionFolderVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<number | undefined>();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedFolder, page, refreshKey]);

  // Listen for folder data changes
  useEffect(() => {
    const handleFolderDataChanged = () => {
      // Refresh folder data by clearing the cached folders
      setFolders([]);
      setRefreshKey(prev => prev + 1);
    };

    eventEmitter.on(EVENTS.FOLDER_DATA_CHANGED, handleFolderDataChanged);
    eventEmitter.on(EVENTS.COLLECTION_ADDED, handleFolderDataChanged);
    eventEmitter.on(EVENTS.COLLECTION_REMOVED, handleFolderDataChanged);
    eventEmitter.on(EVENTS.COLLECTION_MOVED, handleFolderDataChanged);

    return () => {
      eventEmitter.off(EVENTS.FOLDER_DATA_CHANGED, handleFolderDataChanged);
      eventEmitter.off(EVENTS.COLLECTION_ADDED, handleFolderDataChanged);
      eventEmitter.off(EVENTS.COLLECTION_REMOVED, handleFolderDataChanged);
      eventEmitter.off(EVENTS.COLLECTION_MOVED, handleFolderDataChanged);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Always load fresh folder data to ensure counts are up to date
      const foldersData = await api.collection.getFolders();
      setFolders(foldersData);

      // 加载收藏列表
      const params: any = {
        page,
        pageSize,
      };
      if (selectedFolder) {
        params.folderId = selectedFolder;
      }
      const data = await api.collection.getList(params);
      setCollections(data.records || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('加载收藏数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要取消收藏吗？')) {
      return;
    }

    try {
      await api.collection.delete(id);
      toast.success('已取消收藏');
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('取消收藏失败:', error);
      toast.error(error.message || '操作失败');
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === collections.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(collections.map(item => item.id));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;

    if (!confirm(`确定要取消收藏选中的 ${selectedItems.length} 项吗？`)) {
      return;
    }

    try {
      await api.collection.batchDelete(selectedItems);
      toast.success(`已取消收藏 ${selectedItems.length} 项`);
      setSelectedItems([]);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      console.error('批量取消收藏失败:', error);
      toast.error(error.message || '操作失败');
    }
  };

  const handleMove = async () => {
    if (!targetFolderId || selectedItems.length === 0) return;

    try {
      await api.collection.batchMove(targetFolderId, selectedItems);
      toast.success(`已移动 ${selectedItems.length} 项收藏`);
      setSelectedItems([]);
      setShowMoveDialog(false);
      setTargetFolderId(undefined);
      setRefreshKey(prev => prev + 1);

      // Emit collection moved event
      eventEmitter.emit(EVENTS.COLLECTION_MOVED, {
        fromFolderId: selectedFolder,
        toFolderId: targetFolderId
      });
      eventEmitter.emit(EVENTS.FOLDER_DATA_CHANGED);
    } catch (error: any) {
      console.error('移动收藏失败:', error);
      toast.error(error.message || '操作失败');
    }
  };

  const openBlog = (blogId: number) => {
    window.open(`/blog/${blogId}`, '_blank');
  };

  const handleFolderCreated = (newFolder: CollectionFolderVO) => {
    setFolders(prev => [...prev, newFolder]);
    setShowCreateFolder(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleShareFolder = async () => {
    if (!selectedFolder) return;

    try {
      setShareLoading(true);
      const updated = await api.collection.shareFolder(selectedFolder);
      const link = `${window.location.origin}/collection/share/${updated.shareCode}`;
      setShareLink(link);
      setShareDialogOpen(true);
      setShareCopied(false);

      // Update folder in list
      setFolders(prev => prev.map(f => f.id === updated.id ? { ...f, ...updated } : f));
    } catch (error) {
      console.error('生成分享链接失败:', error);
      toast.error('生成分享链接失败');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      toast.success('分享链接已复制');
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  const openBlogInFolder = (folderId: number) => {
    window.open(`/user/collections?folder=${folderId}`, '_blank');
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={selectedFolder?.toString() || "all"}
            onValueChange={(value) => {
              setSelectedFolder(value === "all" ? undefined : Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] sm:w-[200px] text-sm">
              <SelectValue placeholder="选择收藏夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部收藏</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name} ({folder.collectionCount || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateFolder(true)}
            className="text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">新建收藏夹</span>
            <span className="sm:hidden">新建</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {selectedFolder && folders.find(f => f.id === selectedFolder && !f.isDefault) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareFolder}
              disabled={shareLoading}
            >
              <Share2 className="w-4 h-4 mr-1" />
              分享收藏夹
            </Button>
          )}
          {selectedItems.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                已选择 {selectedItems.length} 项
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDialog(true)}
              >
                <FolderOpen className="w-4 h-4 mr-1" />
                移动
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                className="text-destructive"
              >
                批量取消
              </Button>
            </>
          )}
          <span className="text-sm text-muted-foreground">
            共 {total} 项收藏
          </span>
        </div>
      </div>

      {/* 收藏列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {selectedFolder ? '这个收藏夹暂无内容' : '暂无收藏内容'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              去博客页面收藏您感兴趣的文章吧！
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2 p-2 bg-muted rounded">
              <Checkbox
                checked={selectedItems.length === collections.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm">全选</span>
            </div>
          )}
          {collections.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleSelectItem(item.id)}
                      />
                      <h3
                        className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                        onClick={() => openBlog(item.blogId)}
                      >
                        {item.blogTitle}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                      <span>{item.authorName}</span>
                      <span>{item.viewCount} 阅读</span>
                      <span>
                        {item.createTime ? new Date(item.createTime).toLocaleDateString('zh-CN') : '-'}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openBlog(item.blogId)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        查看原文
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openBlogInFolder(item.folderId || 0)}>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        管理收藏夹
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        取消收藏
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {item.blogSummary && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {item.blogSummary}
                  </p>
                )}
                {item.note && (
                  <p className="text-sm bg-blue-50 dark:bg-blue-950 p-2 rounded mb-2">
                    备注：{item.note}
                  </p>
                )}
                {item.folderName && (
                  <Badge variant="secondary" className="text-xs">
                    {item.folderName}
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => prev - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                  上一页
                </Button>
                <span className="text-sm text-muted-foreground">
                  第 {page} 页，共 {Math.ceil(total / pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(total / pageSize)}
                  onClick={() => setPage(prev => prev + 1)}
                >
                  下一页
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 移动对话框 */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>移动收藏</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select
              value={targetFolderId?.toString()}
              onValueChange={(value) => setTargetFolderId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择目标收藏夹" />
              </SelectTrigger>
              <SelectContent>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMoveDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleMove}
              disabled={!targetFolderId || selectedItems.length === 0}
            >
              确认移动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 创建收藏夹对话框 */}
      <FolderCreateForm
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSuccess={handleFolderCreated}
      />

      {/* 分享链接对话框 */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>分享收藏夹</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-sm font-mono break-all flex-1">{shareLink}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              任何人都可以通过此链接访问您的收藏夹，无需登录。
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
            >
              关闭
            </Button>
            <Button
              onClick={handleCopyShareLink}
              className="min-w-[100px]"
            >
              {shareCopied ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  已复制
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-1" />
                  复制链接
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionsManager;
