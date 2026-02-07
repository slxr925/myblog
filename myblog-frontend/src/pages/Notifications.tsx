import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { NotificationVO, NotificationType } from '../types/api';
import NotificationItem from '../components/notification/NotificationItem';
import { Button } from '../components/ui/button';
import { Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '../components/ui/skeleton';

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<NotificationVO[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<NotificationType | 'all'>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchNotifications = async (isRefresh = false) => {
        try {
            if (isRefresh) setLoading(true);
            const currentPage = isRefresh ? 1 : page;
            const params: any = { page: currentPage, size: 20 };
            if (filter !== 'all') {
                params.type = filter;
            }

            const res = await api.notification.getList(params);
            const items = res.content ?? res.records ?? [];

            if (isRefresh) {
                setNotifications(items);
            } else {
                setNotifications(prev => [...prev, ...items]);
            }

            const totalPages = res.totalPages ?? res.pages ?? 1;
            setHasMore(currentPage < totalPages);
            setPage(currentPage + 1);
        } catch (error) {
            console.error('获取通知失败', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(true);
    }, [filter]);

    const handleRead = async (id: number) => {
        // 乐观更新：立即在 UI 上置为已读
        setNotifications(prev => prev.map(n =>
            String(n.id) === String(id) ? { ...n, isRead: true } : n
        ));

        try {
            await api.notification.markAsRead(id);
        } catch (error) {
            console.error('标记已读失败', error);
            // 这里暂不回滚，因为即便失败，本地保持已读通常对用户体验更好，下次刷新会纠正
        }
    };

    const handleDelete = async (id: number) => {
        // 不再弹窗确认，提升操作流畅度
        try {
            await api.notification.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('删除通知失败', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.notification.markAllAsRead();
            setNotifications(prev => prev.map(n => ({
                ...n,
                isRead: true
            })));
        } catch (error) {
            console.error('全部已读失败', error);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header Section */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-center gap-3 mb-2"
                    >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Bell className="w-5 h-5" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground">消息中心</h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        查看所有互动消息和系统通知
                    </motion.p>
                </div>

                {/* 全部已读按钮 */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center mb-6"
                >
                    <Button
                        variant="outline"
                        onClick={handleMarkAllRead}
                        className="bg-card hover:bg-muted text-muted-foreground border-border shadow-sm transition-all hover:shadow"
                        disabled={!notifications.some(n => n.isRead === false)}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        全部已读
                    </Button>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card p-2 rounded-xl border border-border shadow-sm mb-6 flex overflow-x-auto no-scrollbar gap-2"
                >
                    {[
                        { label: '全部消息', value: 'all', icon: Bell },
                        { label: '评论回复', value: NotificationType.COMMENT, icon: null },
                        { label: '收到的赞', value: NotificationType.LIKE, icon: null },
                        { label: '新增关注', value: NotificationType.FOLLOW, icon: null },
                        { label: '系统通知', value: NotificationType.SYSTEM, icon: null },
                    ].map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setFilter(tab.value as any)}
                            className={`
                                relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-2
                                ${filter === tab.value
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                }
                            `}
                        >
                            {/*tab.icon && <tab.icon className="w-4 h-4" />*/}
                            {tab.label}
                            {filter === tab.value && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none"
                                />
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Notification List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {loading && notifications.length === 0 ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-3">
                                    <div className="flex gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-1/4" />
                                            <Skeleton className="h-4 w-3/4" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : notifications.length > 0 ? (
                            notifications.map(notification => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
                                >
                                    <NotificationItem
                                        notification={notification}
                                        onRead={handleRead}
                                        onDelete={handleDelete}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-card rounded-xl border border-border dashed border-2"
                            >
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <Bell className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-lg font-medium text-foreground">暂无消息</p>
                                <p className="text-sm mt-1">当有新的互动时，会在这里显示</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {hasMore && notifications.length > 0 && !loading && (
                        <div className="pt-8 text-center pb-12">
                            <Button
                                variant="ghost"
                                onClick={() => fetchNotifications(false)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                加载更多历史消息
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
