import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../utils/api';
import { CollectToggleDTO, CollectResultDTO } from '../../types/api';
import { toast } from 'sonner';
import FolderSelectDialog from '../collection/FolderSelectDialog';
import { eventEmitter, EVENTS } from '../../utils/events';

interface CollectButtonProps {
  blogId: number;
  isCollected?: boolean;
  onCollectChange?: (collected: boolean) => void;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

const CollectButton: React.FC<CollectButtonProps> = ({
  blogId,
  isCollected: initialIsCollected = false,
  onCollectChange,
  size = 'default',
  showText = true,
  className
}) => {
  const [collected, setCollected] = useState(initialIsCollected);
  const [loading, setLoading] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);

  useEffect(() => {
    // 检查当前收藏状态
    const checkCollectionStatus = async () => {
      try {
        const isCollected = await api.collection.checkCollected(blogId, 'blog');
        setCollected(isCollected);
      } catch (error) {
        console.error('检查收藏状态失败:', error);
      }
    };

    if (blogId) {
      checkCollectionStatus();
    }
  }, [blogId]);

  const handleCollect = async (folderId?: number) => {
    setLoading(true);
    try {
      const data: CollectToggleDTO = {
        targetId: blogId,
        targetType: 'blog',
        folderId
      };

      const result: CollectResultDTO = await api.collection.toggle(data);

      setCollected(result.isCollected);
      onCollectChange?.(result.isCollected);

      // Emit events for folder data updates
      if (result.isCollected) {
        eventEmitter.emit(EVENTS.COLLECTION_ADDED, { folderId });
      } else {
        eventEmitter.emit(EVENTS.COLLECTION_REMOVED, { folderId });
      }
      // Always emit folder data changed event
      eventEmitter.emit(EVENTS.FOLDER_DATA_CHANGED);

      toast.success(result.message);
    } catch (error: any) {
      console.error('收藏操作失败:', error);
      toast.error(error.message || '操作失败，请稍后重试');
    } finally {
      setLoading(false);
      setShowFolderDialog(false);
    }
  };

  const handleClick = () => {
    if (collected) {
      // 已收藏，直接取消收藏
      handleCollect();
    } else {
      // 未收藏，显示文件夹选择对话框
      setShowFolderDialog(true);
    }
  };

  return (
    <>
      <Button
        variant={collected ? "secondary" : "outline"}
        size={size}
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {collected ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
        {showText && size !== 'icon' && (
          <span>{collected ? '已收藏' : '收藏'}</span>
        )}
      </Button>

      <FolderSelectDialog
        open={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        onSelect={handleCollect}
      />
    </>
  );
};

export default CollectButton;