import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AtSign, Bell, FileText, Heart, MessageSquare, Newspaper, UserPlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { NotificationVO } from '../../types/api';

interface NotificationItemProps {
  notification: NotificationVO;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  LIKE: { label: '赞赏', icon: Heart },
  COMMENT: { label: '评论', icon: MessageSquare },
  FOLLOW: { label: '关注', icon: UserPlus },
  MENTION: { label: '@ 提及', icon: AtSign },
  NEW_ARTICLE: { label: '新文章', icon: FileText },
  WEEKLY_DIGEST: { label: '周报摘要', icon: Newspaper },
  SYSTEM: { label: '系统', icon: Bell },
};

const parseDate = (value: unknown) => {
  if (!value) {
    return null;
  }

  try {
    if (Array.isArray(value)) {
      const [year, month, day, hour = 0, minute = 0, second = 0] = value;
      return new Date(year, month - 1, day, hour, minute, second);
    }
    return new Date(value as string);
  } catch {
    return null;
  }
};

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onDelete,
}) => {
  const navigate = useNavigate();

  const extra = React.useMemo(() => {
    const raw = notification.parsedExtraData || notification.extraData || {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw;
  }, [notification.extraData, notification.parsedExtraData]);

  const type = (notification.type || 'SYSTEM').toUpperCase();
  const isUnread = !notification.isRead;
  const meta = TYPE_META[type] || TYPE_META.SYSTEM;
  const Icon = meta.icon;

  const handleOpen = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) {
      return;
    }

    if (isUnread) {
      onRead(notification.id);
    }

    const resourceType = (notification.resourceType || '').toUpperCase();
    const resourceId = notification.resourceId;

    if ((resourceType === 'BLOG' || resourceType === 'ARTICLE') && resourceId) {
      navigate(`/blog/${resourceId}`);
      return;
    }

    if (resourceType === 'COMMENT' && resourceId) {
      const blogId = extra.blogId || extra.blog_id || extra.articleId;
      if (blogId) {
        navigate(`/blog/${blogId}#comment-${resourceId}`);
      }
      return;
    }

    if ((resourceType === 'USER' || type === 'FOLLOW') && (resourceId || notification.senderId)) {
      navigate(`/profile/${resourceId || notification.senderId}`);
    }
  };

  const createdAt = parseDate(notification.createTime);
  const articleTitle = extra.blogTitle || extra.title;

  return (
    <div
      id={`notification-item-${notification.id}`}
      className={`group relative cursor-pointer border border-transparent px-4 py-4 transition-colors hover:bg-muted/20 ${
        isUnread ? 'bg-accent/8' : 'bg-transparent'
      }`}
      onClick={handleOpen}
    >
      {isUnread && <div className="absolute inset-y-4 left-0 w-[3px] bg-accent" />}

      <div className="flex gap-4 pr-8">
        <div className="relative shrink-0">
          {notification.senderAvatar ? (
            <img
              src={notification.senderAvatar}
              alt={notification.senderName || 'avatar'}
              className="h-11 w-11 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-muted text-sm font-mono-display uppercase text-foreground">
              {(notification.senderName || meta.label).charAt(0)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-accent">
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`truncate text-sm ${isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                  {notification.senderName || '系统通知'}
                </span>
                <span className="font-mono-display text-[10px] uppercase tracking-[0.22em] text-accent">
                  {meta.label}
                </span>
              </div>
              <div className="mt-1 text-base text-foreground">{notification.title}</div>
            </div>
            <span className="shrink-0 font-mono-display text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {createdAt ? format(createdAt, 'MM-dd HH:mm', { locale: zhCN }) : '刚刚'}
            </span>
          </div>

          {notification.content && (
            <p className="mt-3 border-l border-border pl-3 text-sm leading-relaxed text-muted-foreground">
              {notification.content}
            </p>
          )}

          {articleTitle && (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <FileText className="h-3.5 w-3.5 text-accent" />
              <span className="truncate">{articleTitle}</span>
            </div>
          )}
        </div>
      </div>

      <button
        className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100"
        title="删除"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(notification.id);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default NotificationItem;
