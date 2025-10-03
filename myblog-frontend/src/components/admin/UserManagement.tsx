import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { User, Search, Ban, Shield, MoreHorizontal } from 'lucide-react';
import { Role, UserStatus, type User as UserType } from '../../types/api';
import { api } from '../../utils/api';

interface UserManagementProps {
  onBack: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers({
        page: currentPage,
        size: 10,
        keyword: searchTerm
      });
      setUsers(response.data.records);
      setTotalUsers(response.data.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === UserStatus.NORMAL ? UserStatus.DISABLED : UserStatus.NORMAL;
      await api.admin.updateUserStatus(userId, newStatus);
      fetchUsers();
    } catch (error) {
      console.error('更新用户状态失败:', error);
    }
  };

  const getRoleBadgeVariant = (role: number) => {
    return role === Role.ADMIN ? 'default' : 'secondary';
  };

  const getRoleText = (role: number) => {
    return role === Role.ADMIN ? '管理员' : '普通用户';
  };

  const getStatusBadgeVariant = (status: number) => {
    return status === UserStatus.NORMAL ? 'default' : 'destructive';
  };

  const getStatusText = (status: number) => {
    return status === UserStatus.NORMAL ? '正常' : '已禁用';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">用户管理</h2>
          <p className="text-muted-foreground">管理系统中的所有用户账户</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          返回控制台
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名、邮箱或昵称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
                      <AvatarFallback>
                        {(user.nickname || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.nickname || user.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleText(user.role)}
                        </Badge>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {getStatusText(user.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.role !== Role.ADMIN && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                      >
                        {user.status === UserStatus.NORMAL ? (
                          <>
                            <Ban className="w-4 h-4 mr-1" />
                            禁用
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-1" />
                            启用
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  暂无用户数据
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};