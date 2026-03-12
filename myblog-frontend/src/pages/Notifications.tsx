import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, FileText, Newspaper } from 'lucide-react';

import NotificationItem from '../components/notification/NotificationItem';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { NotificationType, NotificationVO } from '../types/api';
import { api } from '../utils/api';

const FILTERS: Array<{ label: string; value: NotificationType | 'all'; hint: string }> = [
  { label: '全部消息', value: 'all', hint: '最近互动与系统提醒' },
  { label: '评论回复', value: NotificationType.COMMENT, hint: '文章与评论互动' },
  { label: '收到的赞', value: NotificationType.LIKE, hint: '点赞与认可' },
  { label: '新增关注', value: NotificationType.FOLLOW, hint: '新的关注者' },
  { label: '新文章', value: NotificationType.NEW_ARTICLE, hint: '已关注作者更新' },
  { label: '周报摘要', value: NotificationType.WEEKLY_DIGEST, hint: '过去 7 天的集中摘要' },
  { label: '系统通知', value: NotificationType.SYSTEM, hint: '账户与系统消息' },
];

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationVO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = async (refresh = false) => {
    try {
      if (refresh) {
        setLoading(true);
      }

      const currentPage = refresh ? 1 : page;
      const response = await api.notification.getList({
        page: currentPage,
        size: 20,
        type: filter === 'all' ? undefined : filter,
      });

      const items = response.content ?? response.records ?? [];
      const nextPage = response.number ?? response.current ?? currentPage;
      const pages = response.totalPages ?? response.pages ?? 1;

      setNotifications((prev) => (refresh ? items : [...prev, ...items]));
      setHasMore(nextPage < pages);
      setPage(currentPage + 1);
    } catch (error) {
      console.error('获取通知失败', error);
      if (refresh) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, [filter]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const handleRead = async (id: number) => {
    setNotifications((prev) => prev.map((item) => (
      item.id === id ? { ...item, isRead: true } : item
    )));

    try {
      await api.notification.markAsRead(id);
    } catch (error) {
      console.error('标记通知已读失败', error);
    }
  };

  const handleDelete = async (id: number) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((item) => item.id !== id));

    try {
      await api.notification.delete(id);
    } catch (error) {
      console.error('删除通知失败', error);
      setNotifications(previous);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notification.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('全部标记已读失败', error);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative overflow-hidden border border-border bg-card px-6 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 pattern-editorial-grid opacity-20" />
          <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center border border-border bg-background text-accent">
                  <Bell className="h-5 w-5" />
                </div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.3em] text-accent">Message Ledger</p>
              </div>
              <h1 className="text-editorial-xl text-foreground">通知中心</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                用统一的时间线查看互动、关注作者更新和每周摘要，把重要提醒留在一个清晰的收件箱里。
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border border-border bg-background/80 px-4 py-4">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Unread</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{unreadCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">当前列表内尚未处理的通知</p>
              </div>
              <div className="border border-border bg-background/80 px-4 py-4">
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Subscriptions</p>
                <p className="mt-2 text-base text-foreground">新文章提醒与周报摘要</p>
                <p className="mt-1 text-sm text-muted-foreground">在个人中心里管理订阅偏好与浏览器提醒。</p>
                <Button asChild variant="outline" className="mt-4 rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]">
                  <Link to="/profile">前往个人中心</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_2.05fr]">
          <div className="border border-border bg-card px-5 py-5 sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-border pb-3">
              <div>
                <p className="font-mono-display text-[11px] uppercase tracking-[0.24em] text-accent">Filter Shelf</p>
                <p className="mt-1 text-sm text-muted-foreground">按通知类型缩小收件范围</p>
              </div>
              <Button
                variant="outline"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]"
              >
                <Check className="mr-2 h-4 w-4" />
                全部已读
              </Button>
            </div>

            <div className="space-y-2">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`w-full border px-4 py-3 text-left transition-colors ${
                    filter === item.value
                      ? 'border-accent bg-accent/10 text-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  <div className="font-mono-display text-[11px] uppercase tracking-[0.22em]">
                    {item.label}
                  </div>
                  <div className="mt-1 text-sm opacity-80">{item.hint}</div>
                </button>
              ))}
            </div>

            <div className="mt-6 border border-border bg-background px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center border border-border text-accent">
                  {filter === NotificationType.WEEKLY_DIGEST ? <Newspaper className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-mono-display text-[11px] uppercase tracking-[0.22em] text-accent">Current Focus</p>
                  <p className="mt-1 text-sm text-foreground">{FILTERS.find((item) => item.value === filter)?.label || '全部消息'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card">
            {loading && notifications.length === 0 ? (
              <div className="space-y-4 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="border border-border bg-background p-4">
                    <div className="flex gap-4">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <>
                <div className="divide-y divide-border">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <NotificationItem
                        notification={notification}
                        onRead={handleRead}
                        onDelete={handleDelete}
                      />
                    </motion.div>
                  ))}
                </div>

                {hasMore && !loading && (
                  <div className="border-t border-border px-5 py-5 text-center">
                    <Button
                      variant="outline"
                      onClick={() => fetchNotifications(false)}
                      className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.22em]"
                    >
                      加载更多历史消息
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center border border-border bg-background text-accent">
                  <Bell className="h-6 w-6" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-foreground">暂无消息</h2>
                <p className="mt-2 max-w-md text-muted-foreground">
                  当评论、点赞、关注作者更新或每周摘要抵达时，会统一出现在这里。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Notifications;
