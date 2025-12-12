import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { api } from '../../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useFollow } from '../../contexts/FollowContext';

interface FollowButtonProps {
    userId: number;
    username?: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?: 'default' | 'outline' | 'ghost' | 'secondary';
    showText?: boolean;
    className?: string;
    onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
    userId,
    username,
    size = 'default',
    variant,
    showText = true,
    className = '',
    onFollowChange,
}) => {
    const { user } = useAuth();
    const { openAuthModal } = useAuthModal();
    const { isUserFollowed, addFollowedUser, removeFollowedUser } = useFollow();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);

    // 用户不能关注自己
    const isSelf = user?.id === userId;

    useEffect(() => {
        // 检查关注状态（仅在组件首次加载时）
        const checkFollowStatus = async () => {
            if (!user || isSelf) return;

            try {
                const status = await api.follow.checkFollowStatus(userId);
                setIsFollowing(status);
                // 同步到全局状态
                if (status) {
                    addFollowedUser(userId);
                } else {
                    removeFollowedUser(userId);
                }
            } catch (error) {
                console.error('检查关注状态失败:', error);
            }
        };

        if (userId) {
            checkFollowStatus();
        }
    }, [userId, user, isSelf]); // 移除addFollowedUser和removeFollowedUser依赖，避免重复调用

    // 同步全局状态到本地状态（这是状态的唯一真实来源）
    useEffect(() => {
        if (user && !isSelf) {
            const globalStatus = isUserFollowed(userId);
            setIsFollowing(globalStatus);
        }
    }, [isUserFollowed, userId, user, isSelf]);

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止事件冒泡

        // 未登录，打开登录弹窗
        if (!user) {
            openAuthModal();
            return;
        }

        // 防止关注自己
        if (isSelf) {
            toast.error('不能关注自己');
            return;
        }

        // 防止重复点击
        if (loading) {
            return;
        }

        setLoading(true);
        try {
            if (isFollowing) {
                // 取消关注
                await api.follow.unfollowUser(userId);
                setIsFollowing(false);
                removeFollowedUser(userId);
                toast.success(`已取消关注${username ? ` ${username}` : ''}`);
                onFollowChange?.(false);
            } else {
                // 关注
                await api.follow.followUser(userId);
                setIsFollowing(true);
                addFollowedUser(userId);
                toast.success(`已关注${username ? ` ${username}` : ''}`);
                onFollowChange?.(true);
            }
        } catch (error: any) {
            console.error('关注操作失败:', error);
            toast.error(error.message || '操作失败，请稍后重试');
            // 操作失败时回滚状态
            setIsFollowing(!isFollowing);
        } finally {
            setLoading(false);
        }
    };

    // 不显示按钮的情况：用户未定义或用户关注自己
    if (!userId || isSelf) {
        return null;
    }

    // 根据状态选择默认的variant
    const buttonVariant = variant || (isFollowing ? 'secondary' : 'default');

    return (
        <Button
            variant={buttonVariant}
            size={size}
            onClick={handleClick}
            disabled={loading}
            className={`${className} ${isFollowing ? 'border-gray-300' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
            {isFollowing ? (
                <UserCheck className="w-4 h-4" />
            ) : (
                <UserPlus className="w-4 h-4" />
            )}
            {showText && size !== 'icon' && (
                <span className="ml-1">{isFollowing ? '已关注' : '关注'}</span>
            )}
        </Button>
    );
};

export default FollowButton;
