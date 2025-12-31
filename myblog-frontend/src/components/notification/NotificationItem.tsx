import React from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { NotificationVO, NotificationType, NotificationStatus } from '../../types/api';
import { Heart, MessageSquare, UserPlus, Bell, AtSign } from 'lucide-react';
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

    // 解析 extraData (增强稳健性：处理可能的 JSON 字符串)
    let extra = notification.parsedExtraData || notification.extraData || {};
    if (typeof extra === 'string') {
        try {
            extra = JSON.parse(extra);
        } catch (e) {
            extra = {};
        }
    }

    const handleClick = () => {
        // 标记为已读 (以后端确定的 isRead 为准)
        if (!notification.isRead) {
            onRead(notification.id);
        }

        // 根据 type 和 resource 跳转
        const { resourceType, resourceId, type, senderId } = notification;
        const normalizedResourceType = resourceType?.toUpperCase();

        // 优先处理资源跳转
        if (normalizedResourceType && resourceId) {
            if (normalizedResourceType === 'BLOG') {
                navigate(`/blog/${resourceId}`);
                return;
            }
            if (normalizedResourceType === 'COMMENT') {
                // 优先从 extra 中取 blogId
                const blogId = extra.blogId || extra.blog_id;
                if (blogId) {
                    navigate(`/blog/${blogId}#comment-${resourceId}`);
                } else {
                    // Fallback: 如果是评论但没拿到blogId，尝试直接跳转(虽然可能不带锚点)
                    navigate(`/blog/${resourceId}`);
                }
                return;
            }
            if (normalizedResourceType === 'USER') {
                navigate(`/profile/${resourceId}`);
                return;
            }
        }

        // 其次处理类型跳转
        if (type === NotificationType.FOLLOW && senderId) {
            navigate(`/profile/${senderId}`);
            return;
        }
    };

    const getIcon = () => {
        switch (notification.type) {
            case NotificationType.LIKE:
                return <Heart className="w-5 h-5 text-red-500 dark:text-red-500 fill-red-500 dark:fill-red-500" />;
            case NotificationType.COMMENT:
                return <MessageSquare className="w-5 h-5 text-blue-500 dark:text-blue-500 fill-blue-500 dark:fill-blue-500" />;
            case NotificationType.FOLLOW:
                return <UserPlus className="w-5 h-5 text-green-500 dark:text-green-500" />;
            case NotificationType.MENTION:
                return <AtSign className="w-5 h-5 text-purple-500 dark:text-purple-500" />;
            default:
                return <Bell className="w-5 h-5 text-yellow-500 dark:text-yellow-500" />;
        }
    };

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        try {
            // 尝试处理数组格式 [yyyy, MM, dd, HH, mm, ss]
            if (Array.isArray(timeStr)) {
                const date = new Date(timeStr[0], timeStr[1] - 1, timeStr[2], timeStr[3], timeStr[4], timeStr[5]);
                return format(date, 'MM-dd HH:mm', { locale: zhCN });
            }
            return format(new Date(timeStr), 'MM-dd HH:mm', { locale: zhCN });
        } catch (e) {
            return '刚刚';
        }
    };

    const isUnread = !notification.isRead;

    return (
        <div
            className={`p-4 border-b border-border hover:bg-muted/50 transition-colors cursor-pointer relative group ${isUnread ? 'bg-primary/5' : ''
                }`}
            onClick={handleClick}
        >
            <div className="flex gap-4 pr-6"> {/* pr-6 留出删除按钮空间 */}
                {/* Avatar / Icon */}
                <div className="flex-shrink-0 mt-1">
                    {notification.senderAvatar ? (
                        <div className="relative">
                            <img
                                src={notification.senderAvatar}
                                alt={notification.senderName}
                                className="w-10 h-10 rounded-full object-cover border border-border"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm">
                                {getIcon()}
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                            {getIcon()}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <span className="font-medium text-foreground text-sm">
                            {notification.senderName || '系统通知'}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatTime(notification.createTime)}
                        </span>
                    </div>

                    <div className="text-sm text-foreground line-clamp-2">
                        <span className="mr-1">{notification.title}</span>
                    </div>

                    {notification.content && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md border border-border/50 line-clamp-2">
                            {notification.content}
                        </div>
                    )}

                    {/* Extra Info (e.g. blog title) */}
                    {(extra.blogTitle || extra.title) && (
                        <div className="text-xs text-muted-foreground mt-1">
                            <span className="hover:underline">
                                原文: {extra.blogTitle || extra.title}
                            </span>
                        </div>
                    )}
                </div>

                {/* Delete Button - Absolute positioned but safe from overlap */}
                <button
                    className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(notification.id);
                    }}
                    title="删除通知"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Unread Indicator */}
            {isUnread && (
                <div className="absolute top-1/2 -translate-y-1/2 right-2 w-2 h-2 bg-primary rounded-full pointer-events-none" />
            )}
        </div>
    );
};

export default NotificationItem;
