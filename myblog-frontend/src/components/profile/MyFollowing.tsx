import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, User as UserIcon, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { api } from '../../utils/api';
import type { UserFollowVO } from '../../types/api';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FollowButton from '../user/FollowButton';

interface Message {
    type: 'success' | 'error';
    text: string;
}

export const MyFollowing: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [following, setFollowing] = useState<UserFollowVO[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const { user } = useAuth();
    const { openAuthModal } = useAuthModal();

    // 获取关注列表
    const fetchFollowing = async (page: number = 1) => {
        if (!user) {
            setHasLoaded(true);
            return;
        }

        try {
            setLoading(true);
            const response = await api.follow.getMyFollowing(page, pageSize);
            if (response && response.records) {
                setFollowing(response.records);
                setTotal(response.total);
            } else {
                setFollowing([]);
                setTotal(0);
            }
        } catch (error: any) {
            console.error('获取关注列表失败:', error);
            setMessages([{ type: 'error', text: error.message || '获取关注列表失败，请稍后重试' }]);
            setFollowing([]);
            setTotal(0);
        } finally {
            setLoading(false);
            setHasLoaded(true);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFollowing(currentPage);
        }
    }, [currentPage, user]);

    // 关注状态变化回调 - 需要根据userId来移除对应用户
    const createFollowChangeHandler = (userId: number) => (isFollowing: boolean) => {
        if (!isFollowing) {
            // 取消关注时，立即从列表中移除该用户
            setFollowing(prev => prev.filter(f => f.userId !== userId));
        }
        // 无论关注还是取消关注，都刷新获取最新数据
        setTimeout(() => fetchFollowing(currentPage), 100);
    };

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
            <Card>
                <CardContent className="p-12 text-center">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-4">请先登录查看您的关注</p>
                    <Button onClick={openAuthModal} className="bg-indigo-600 hover:bg-indigo-700">
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
                    <UserCheck className="w-6 h-6 text-indigo-600" />
                    我关注的
                </h2>
                <p className="text-muted-foreground mt-1">
                    您关注的用户列表
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
                        <Card className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-3">
                                    <AlertCircle className={`w-5 h-5 ${message.type === 'success' ? 'text-green-500' : 'text-red-500'
                                        }`} />
                                    <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                                        {message.text}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* 数据列表 - 加载完成前不显示任何内容 */}
            {!hasLoaded ? null : following.length > 0 ? (
                <div className="space-y-4">
                    {following.map((followedUser) => (
                        <Card key={followedUser.userId} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={followedUser.avatar} alt={followedUser.nickname || followedUser.username} />
                                            <AvatarFallback className="text-lg bg-indigo-100 text-indigo-600">
                                                {(followedUser.nickname || followedUser.username).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-gray-800">{followedUser.nickname || followedUser.username}</span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDistanceToNow(new Date(followedUser.followTime), {
                                                        addSuffix: true,
                                                        locale: zhCN,
                                                    })}关注
                                                </span>
                                            </div>
                                            {followedUser.bio && (
                                                <div className="text-sm text-gray-600 mb-2">
                                                    {followedUser.bio}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <FollowButton
                                        userId={followedUser.userId}
                                        username={followedUser.nickname || followedUser.username}
                                        size="sm"
                                        onFollowChange={createFollowChangeHandler(followedUser.userId)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <UserCheck className="w-16 h-16 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-xl font-semibold mb-2">还没有关注任何人</h3>
                            <p className="text-muted-foreground">
                                去发现一些有趣的作者并关注他们吧！
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
                        <span className="text-sm text-gray-600">
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

export default MyFollowing;
