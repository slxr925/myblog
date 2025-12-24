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
            <Card>
                <CardContent className="p-12 text-center">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg mb-4">请先登录查看您的粉丝</p>
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
                    <Users className="w-6 h-6 text-indigo-600" />
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
            {!hasLoaded ? null : followers.length > 0 ? (
                <div className="space-y-3">
                    {followers.map((follower) => (
                        <Card key={follower.userId} className="hover:shadow-md transition-shadow py-0">
                            <CardContent className="p-4">
                                <div className="flex items-start space-x-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={follower.avatar} alt={follower.nickname || follower.username} />
                                        <AvatarFallback className="text-base bg-indigo-100 text-indigo-600">
                                            {(follower.nickname || follower.username).charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm text-gray-800">{follower.nickname || follower.username}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(new Date(follower.followTime), {
                                                    addSuffix: true,
                                                    locale: zhCN,
                                                })}关注了您
                                            </span>
                                        </div>
                                        {follower.bio && (
                                            <div className="text-xs text-gray-600 line-clamp-1">
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
                <Card className="p-12">
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

export default MyFollowers;
