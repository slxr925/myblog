import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { NotificationVO, NotificationType } from '../../types/api';
import { Heart, MessageSquare, UserPlus, Bell, AtSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
    notification: NotificationVO;
    onRead: (id: any) => void;
    onDelete: (id: any) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
    notification,
    onRead,
    onDelete
}) => {
    const navigate = useNavigate();

    // 增强解析 extraData
    const extra = React.useMemo(() => {
        let ex = notification.parsedExtraData || notification.extraData || {};
        if (typeof ex === 'string') {
            try { return JSON.parse(ex); } catch (e) { return {}; }
        }
        return ex;
    }, [notification.parsedExtraData, notification.extraData]);

    const handleClick = (e: React.MouseEvent) => {
        // 防止点击删除按钮触发整行点击
        if ((e.target as HTMLElement).closest('button')) return;

        console.log('[Notification] Click processing:', notification);

        // 1. 触发已读 (标记同步)
        if (!notification.isRead) {
            onRead(notification.id);
        }

        // 2. 跳转逻辑 - 强制大小写不敏感
        const typeStr = (notification.type || '').toUpperCase();
        const resType = (notification.resourceType || '').toUpperCase();
        const resId = notification.resourceId;

        // 2.1 博客相关 (点赞、收藏、顶级评论)
        if ((resType === 'BLOG' || resType === 'ARTICLE') && resId) {
            navigate(`/blog/${resId}`);
            return;
        }

        // 2.2 评论回复相关
        if (resType === 'COMMENT' && resId) {
            const bId = extra.blogId || extra.blog_id || extra.articleId;
            if (bId) {
                navigate(`/blog/${bId}#comment-${resId}`);
            } else {
                // 如果是顶级评论，有时候 resourceType 可能是 COMMENT 但此时 resId 可能就是 blogId
                // 此时尝试直接跳转
                navigate(`/blog/${resId}`);
            }
            return;
        }

        // 2.3 用户相关
        if (resType === 'USER' || typeStr === 'FOLLOW') {
            const uId = resId || notification.senderId;
            if (uId) navigate(`/profile/${uId}`);
            return;
        }

        console.log('[Notification] No specific jump path found');
    };

    const getIcon = () => {
        const iconClass = "w-5 h-5";
        const typeStr = (notification.type || '').toUpperCase();
        switch (typeStr) {
            case 'LIKE':
                return <Heart className={`${iconClass} text-red-500 fill-red-500`} />;
            case 'COMMENT':
                return <MessageSquare className={`${iconClass} text-blue-500 fill-blue-500`} />;
            case 'FOLLOW':
                return <UserPlus className={`${iconClass} text-green-500`} />;
            case 'MENTION':
                return <AtSign className={`${iconClass} text-purple-500`} />;
            default:
                return <Bell className={`${iconClass} text-yellow-500`} />;
        }
    };

    const formatTime = (timeStr: any) => {
        if (!timeStr) return '';
        try {
            if (Array.isArray(timeStr)) {
                const date = new Date(timeStr[0], timeStr[1] - 1, timeStr[2], timeStr[3], timeStr[4], timeStr[5]);
                return format(date, 'MM-dd HH:mm', { locale: zhCN });
            }
            return format(new Date(timeStr), 'MM-dd HH:mm', { locale: zhCN });
        } catch (e) {
            return '刚刚';
        }
    };

    // 状态判定：使用 ! 判定，确保 undefined/false 均视为未读，只要不是 true 就是未读
    const isUnread = !notification.isRead;

    return (
        <div
            id={`notification-item-${notification.id}`}
            className={`p-4 border-b border-border hover:bg-muted/50 transition-all duration-200 cursor-pointer relative group ${isUnread ? 'bg-blue-500/[0.04] dark:bg-blue-500/[0.08]' : 'bg-transparent'
                }`}
            onClick={handleClick}
        >
            <div className="flex gap-4 pr-10">
                <div className="flex-shrink-0">
                    <div className="relative">
                        {notification.senderAvatar ? (
                            <img
                                src={notification.senderAvatar}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border text-muted-foreground uppercase text-xs">
                                {notification.senderName?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border scale-75">
                            {getIcon()}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <span className={`text-sm truncate ${isUnread ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                            {notification.senderName || '系统通知'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTime(notification.createTime)}
                        </span>
                    </div>

                    <div className={`text-sm ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {notification.title}
                    </div>

                    {notification.content && (
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1 px-3 py-2 bg-muted/40 rounded border border-border/30 italic">
                            {notification.content}
                        </div>
                    )}

                    {(extra.blogTitle || extra.title) && (
                        <div className="text-xs text-blue-500/80 mt-1 truncate">
                            相关文章: {extra.blogTitle || extra.title}
                        </div>
                    )}
                </div>
            </div>

            {/* 未读指示点 - 显著的蓝色圆点 (如果未读则显示，点击后应立即消失) */}
            {isUnread && (
                <div className="absolute top-[22px] right-3 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
            )}

            <button
                className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                title="删除"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                }}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
};

export default NotificationItem;
