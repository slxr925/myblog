import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User as UserIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { api } from '../../utils/api';
import type { UserFollowVO } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';


interface Message {
    type: 'success' | 'error';
    text: string;
}

export const MyFollowers: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [followers, setFollowers] = useState<UserFollowVO[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const { user } = useAuth();
    const { openAuthModal } = useAuthModal();

    // 获取粉丝列表
    const fetchFollowers = async (page: number = 1) => {
        if (!user) {
            setHasLoaded(true);
            return;
        }

        try {
            setLoading(true);
            const response = await api.follow.getMyFollowers(page, pageSize);
            if (response && response.records) {
                setFollowers(response.records);
                setTotal(response.total);
            } else {
                setFollowers([]);
                setTotal(0);
            }
        } catch (error: any) {
            console.error('获取粉丝列表失败:', error);
            setMessages([{ type: 'error', text: error.message || '获取粉丝列表失败，请稍后重试' }]);
            setFollowers([]);
            setTotal(0);
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFollowers(currentPage);
        }
    }, [currentPage, user]);



    // 消息自动消失
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => {
                setMessages([]);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [messages]);

    if (!user) {
        return (
            <Card className="rounded-none border-border">
                <CardContent className="p-12 text-center">
                    <UserIcon className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="mb-4 text-lg text-muted-foreground">请先登录查看您的粉丝</p>
                    <Button onClick={openAuthModal} className="rounded-none">
                        立即登录
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* 标题栏 */}
            <div>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Users className="w-6 h-6 text-accent" />
                    我的粉丝
                </h2>
                <p className="text-muted-foreground mt-1">
                    关注您的用户列表
                </p>
            </div>

            <AnimatePresence>
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <Card className="rounded-none border-border bg-muted/20">
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <AlertCircle className="w-5 h-5 text-accent" />
                                    <span className="text-foreground">
                                        {message.text}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 数据列表 - 加载完成前不显示任何内容 */}
            {!hasLoaded ? null : followers.length > 0 ? (
                <div className="space-y-3">
                    {followers.map((follower) => (
                        <Card key={follower.userId} className="rounded-none border-border py-0 transition-colors hover:border-accent/40">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={follower.avatar} alt={follower.nickname || follower.username} />
                                        <AvatarFallback className="bg-muted text-base text-foreground">
                                            {(follower.nickname || follower.username).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-foreground">{follower.nickname || follower.username}</span>
                                            <span className="font-mono-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                                {formatDistanceToNow(new Date(follower.followTime), {
                                                    addSuffix: true,
                                                    locale: zhCN,
                                                })}关注了您
                                            </span>
                                        </div>
                                        {follower.bio && (
                                            <div className="line-clamp-1 text-xs text-muted-foreground">
                                                {follower.bio}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="rounded-none border-border p-12">
                    <div className="text-center space-y-4">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-xl font-semibold mb-2">还没有粉丝</h3>
                            <p className="text-muted-foreground">
                                发布优质内容，吸引更多关注者吧！
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* 分页 */}
            {total > pageSize && (
                <div className="flex justify-center pt-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            上一页
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            第 {currentPage} 页，共 {Math.ceil(total / pageSize)} 页
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage >= Math.ceil(total / pageSize)}
                        >
                            下一页
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyFollowers;
