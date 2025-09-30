import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types/api';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut } from 'lucide-react';

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const handleProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const getRoleBadgeVariant = (role: number) => {
    return role === Role.ADMIN ? 'default' : 'secondary';
  };

  const getRoleText = (role: number) => {
    return role === Role.ADMIN ? '管理员' : '普通用户';
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* 用户头像按钮 - 显示昵称 */}
      <Button
        variant="ghost"
        className="relative h-10 px-3 rounded-full flex items-center space-x-2"
        onClick={handleToggle}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar || '/default-avatar.png'} alt={user.nickname || user.username} />
          <AvatarFallback className="text-sm">
            {(user.nickname || user.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium hidden sm:block">
          {user.nickname || user.username}
        </span>
      </Button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景点击区域 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* 菜单内容 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 z-50 w-80"
            >
              <Card className="shadow-lg">
                <CardContent className="p-4 space-y-4">
                  {/* 用户信息 */}
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
                      <AvatarFallback className="text-lg">
                        {(user.nickname || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {user.nickname || user.username}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                        {getRoleText(user.role)}
                      </Badge>
                    </div>
                  </div>

                  {/* 用户统计信息 */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">注册时间</div>
                      <div className="text-muted-foreground">
                        {user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">账户状态</div>
                      <div className={`text-muted-foreground ${user.status === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {user.status === 0 ? '正常' : '已禁用'}
                      </div>
                    </div>
                  </div>

                  {/* 个人简介 */}
                  {user.bio && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
                      <div className="font-medium mb-1">个人简介</div>
                      <div className="line-clamp-2">{user.bio}</div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="space-y-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleProfile}
                    >
                      <User className="w-4 h-4 mr-2" />
                      个人资料
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setIsOpen(false);
                        navigate('/dashboard');
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      控制台
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      退出登录
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};