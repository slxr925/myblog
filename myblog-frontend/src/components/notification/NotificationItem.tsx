import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { NotificationVO, NotificationType } from '../../types/api';
import { Heart, MessageSquare, UserPlus, Bell, AtSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
    notification: NotificationVO;
    onRead: (id: number) => void;
    onDelete: (id: number) => void;
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

        console.log('[Notification] Clicked notification ID:', notification.id);

        // 1. 立即触发标记已读 (即使没跳转也应起效)
        if (!notification.isRead) {
            onRead(notification.id);
        }

        // 2. 跳转逻辑
        const { resourceType, resourceId, type, senderId } = notification;
        const resType = resourceType?.toUpperCase();

        // 处理逻辑优先级

        // 如果是系统通知且没资源，不跳转
        if (type === NotificationType.SYSTEM && !resType) {
            return;
        }

        // 2.1 博客详情跳转 (文章、点赞、顶级评论)
        if ((resType === 'BLOG' || resType === 'ARTICLE') && resourceId) {
            navigate(`/blog/${resourceId}`);
            return;
        }

        // 2.2 评论回复跳转
        if (resType === 'COMMENT' && resourceId) {
            // 后端保证在 extraData 里放了 blogId
            const bId = extra.blogId || extra.blog_id || extra.articleId;
            if (bId) {
                navigate(`/blog/${bId}#comment-${resourceId}`);
            } else {
                // 如果实在没找到 blogId，有些旧通知可能把 blogId 放在了 resourceId 里
                // (这是一个猜测，但为了增强跳转率可以尝试)
                console.warn('Comment type notice missing blogId, resourceId is:', resourceId);
                // 暂时不盲目跳，以免 404
            }
            return;
        }

        // 2.3 用户个人中心跳转
        if (resType === 'USER' || type === NotificationType.FOLLOW) {
            const uId = resourceId || senderId;
            if (uId) navigate(`/profile/${uId}`);
            return;
        }
    };

    const getIcon = () => {
        const iconClass = "w-5 h-5";
        switch (notification.type) {
            case NotificationType.LIKE:
                return <Heart className={`${iconClass} text-red-500 fill-red-500`} />;
            case NotificationType.COMMENT:
                return <MessageSquare className={`${iconClass} text-blue-500 fill-blue-500`} />;
            case NotificationType.FOLLOW:
                return <UserPlus className={`${iconClass} text-green-500`} />;
            case NotificationType.MENTION:
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

    // 重点：使用更宽松的未读判断
    const isUnread = notification.isRead === false || (notification as any).isRead === 0;

    return (
        <div
            className={`p-4 border-b border-border hover:bg-muted/50 transition-all duration-200 cursor-pointer relative group ${isUnread ? 'bg-blue-500/5 dark:bg-blue-500/10' : 'bg-transparent'
                }`}
            onClick={handleClick}
        >
            <div className="flex gap-4 pr-10">
                {/* 左侧头像或图标 */}
                <div className="flex-shrink-0">
                    <div className="relative">
                        {notification.senderAvatar ? (
                            <img
                                src={notification.senderAvatar}
                                alt={notification.senderName || 'Sender'}
                                className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                                {getIcon()}
                            </div>
                        )}
                        {notification.senderAvatar && (
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                                {getIcon()}
                            </div>
                        )}
                    </div>
                </div>

                {/* 中间内容 */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <span className="font-semibold text-foreground text-sm truncate">
                            {notification.senderName || '系统通知'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTime(notification.createTime)}
                        </span>
                    </div>

                    <div className="text-sm font-medium text-foreground">
                        {notification.title}
                    </div>

                    {notification.content && (
                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1 px-3 py-2 bg-muted/40 rounded border border-border/30">
                            {notification.content}
                        </div>
                    )}

                    {(extra.blogTitle || extra.title) && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic overflow-hidden text-ellipsis whitespace-nowrap">
                            原文: {extra.blogTitle || extra.title}
                        </div>
                    )}
                </div>
            </div>

            {/* 未读指示点 - 显眼的蓝色点（呼应用户说的黑点，但在颜色上做差异化确保由我控制） */}
            {isUnread && (
                <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] animate-pulse" />
            )}

            {/* 删除按钮 */}
            <button
                className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                }}
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default NotificationItem;
