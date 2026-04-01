import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
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
import { MoreHorizontal, ExternalLink, FolderOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { api } from '../../utils/api';
import { getPublicBlogPath } from '../../utils/blogLinks';
import { UserCollectionVO, CollectionFolderVO } from '../../types/api';
import { toast } from 'sonner';
import { eventEmitter, EVENTS } from '../../utils/events';

const MyCollections: React.FC = () => {
  const [collections, setCollections] = useState<UserCollectionVO[]>([]);
  const [folders, setFolders] = useState<CollectionFolderVO[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [total, setTotal] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState<number | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  React.useEffect(() => {
    loadData();
  }, [selectedFolder, page, refreshKey]);

  React.useEffect(() => {
    const handleFolderDataChanged = () => {
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
      const foldersData = await api.collection.getFolders();
      setFolders(foldersData);

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
      eventEmitter.emit(EVENTS.COLLECTION_REMOVED, { folderId: selectedFolder });
      eventEmitter.emit(EVENTS.FOLDER_DATA_CHANGED);
    } catch (error: any) {
      console.error('取消收藏失败:', error);
      toast.error(error.message || '操作失败');
    }
  };

  const openBlog = (item: UserCollectionVO) => {
    window.open(getPublicBlogPath({ publicId: item.publicId ?? item.blog?.publicId, id: item.blogId }), '_blank');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">筛选：</span>
          <Select
            value={selectedFolder?.toString() || "all"}
            onValueChange={(value) => {
              setSelectedFolder(value === "all" ? undefined : Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="全部收藏夹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部收藏夹</SelectItem>
              {folders.map(folder => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name} {folder.isDefault && '(默认)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          共 {total} 项收藏
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : collections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bookmark className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {selectedFolder ? '这个收藏夹暂无内容' : '暂无收藏内容'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              去博客页面收藏您感兴趣的文章吧！
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {collections.map(item => (
            <Card key={item.id} className="hover:shadow-md transition-shadow py-0">
              <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => openBlog(item)}>
                    <img
                      src={`https://picsum.photos/seed/collect${item.id}/400/300.jpg`}
                      alt={item.blogTitle}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-medium text-foreground mb-1.5 line-clamp-1 hover:text-primary transition-colors cursor-pointer"
                      onClick={() => openBlog(item)}
                    >
                      {item.blogTitle}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{item.authorName}</span>
                      <span>{item.viewCount} 阅读</span>
                      <span>
                        {formatDistanceToNow(new Date(item.createTime || ''), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </span>
                    </div>
                    {item.blogSummary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {item.blogSummary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.folderName && (
                      <Badge variant="secondary" className="text-xs">
                        {item.folderName}
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openBlog(item)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          查看原文
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => window.open(`/user/collections?folder=${item.folderId}`, '_blank')}
                        >
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
                </div>
              </CardContent>
            </Card>
          ))}

          {total > pageSize && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(prev => prev - 1)}
                >
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
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyCollections;
