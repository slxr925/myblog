import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../utils/api';
import { NotificationVO, NotificationStatus } from '../../types/api';
import NotificationItem from './NotificationItem';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

const NotificationBadge: React.FC = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationVO[]>([]);
    const [loading, setLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const { unreadCount: wsUnreadCount, newNotification } = useWebSocket();

    // 初始化获取未读数
    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchUnreadCount = async () => {
            try {
                const res = await api.notification.getUnreadCount();
                setUnreadCount(res.total);
            } catch (error) {
                console.error('获取未读数失败', error);
            }
        };

        fetchUnreadCount();
    }, [isAuthenticated]);

    // 监听WebSocket推送的未读数变化
    useEffect(() => {
        if (wsUnreadCount !== null) {
            setUnreadCount(wsUnreadCount);
        }
    }, [wsUnreadCount]);

    // 监听新通知推送
    useEffect(() => {
        if (newNotification) {
            // 如果下拉框打开，将新通知加入列表顶部
            if (isOpen) {
                setNotifications(prev => [newNotification, ...prev]);
            }
            // 播放提示音或显示Toast (可选)
        }
    }, [newNotification, isOpen]);

    // 点击外部关闭下拉框
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggle = async () => {
        if (!isOpen) {
            setIsOpen(true);
            setLoading(true);
            try {
                // 获取前5条未读通知，如果没有则获取最新5条
                const res = await api.notification.getList({ page: 1, size: 5 });
                setNotifications(res.content);
            } catch (error) {
                console.error('获取通知列表失败', error);
            } finally {
                setLoading(false);
            }
        } else {
            setIsOpen(false);
        }
    };

    const handleRead = async (id: number) => {
        try {
            await api.notification.markAsRead(id);
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, status: NotificationStatus.READ } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('标记已读失败', error);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.notification.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            // 重新获取未读数，因为刚才删除的可能是未读的
            const res = await api.notification.getUnreadCount();
            setUnreadCount(res.total);
        } catch (error) {
            console.error('删除通知失败', error);
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate('/notifications');
    };

    const handleMarkAllRead = async () => {
        try {
            await api.notification.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, status: NotificationStatus.READ })));
            setUnreadCount(0);
        } catch (error) {
            console.error('全部已读失败', error);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={popoverRef}>
            <Button
                variant="ghost"
                size="icon"
                className="relative text-foreground hover:bg-accent transition-colors duration-300"
                onClick={handleToggle}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in duration-300 shadow-sm pointer-events-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </Button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                        <h3 className="font-semibold text-foreground">通知</h3>
                        <div className="flex gap-2">
                            <button
                                className="text-xs text-primary hover:underline disabled:opacity-50"
                                onClick={handleMarkAllRead}
                                disabled={unreadCount === 0}
                            >
                                全部已读
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                加载中...
                            </div>
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-border">
                                {notifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onRead={handleRead}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center flex flex-col items-center text-muted-foreground">
                                <Bell className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm">暂无新通知</p>
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-border bg-muted/30 text-center">
                        <button
                            className="text-sm text-foreground hover:text-primary transition-colors font-medium w-full py-1"
                            onClick={handleViewAll}
                        >
                            查看全部通知
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBadge;
