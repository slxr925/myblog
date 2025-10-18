import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import {
  ArrowLeft,
  Search,
  Ban,
  Shield,
  Users,
  Calendar,
  Mail,
  Activity,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX
} from 'lucide-react';
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.admin.getUsers({
        page: currentPage,
        size: 12,
        keyword: searchTerm
      });
      console.log('API返回的完整响应:', response);
      console.log('API返回的用户数据:', response.data);

      // 处理不同的数据结构
      let userData = [];
      let totalCount = 0;

      if (response && response.data) {
        console.log('response.data 存在:', response.data);

        // 处理标准API响应格式: {code, message, data: {records, total}}
        if (response.data.data && response.data.data.records && Array.isArray(response.data.data.records)) {
          userData = response.data.data.records;
          totalCount = response.data.data.total || 0;
          console.log('使用 API data.records 结构:', userData.length, 'total:', totalCount);
        }
        // 处理直接的records结构: {records, total}
        else if (response.data.records && Array.isArray(response.data.records)) {
          userData = response.data.records;
          totalCount = response.data.total || 0;
          console.log('使用 records 结构:', userData.length, 'total:', totalCount);
        }
        // 处理直接数组结构
        else if (Array.isArray(response.data)) {
          userData = response.data;
          totalCount = userData.length;
          console.log('使用数组结构:', userData.length, 'total:', totalCount);
        } else {
          console.log('未识别的数据结构:', typeof response.data, response.data);
        }
      } else {
        console.log('response.data 不存在');
      }

      console.log('最终处理后的用户数据:', userData);
      console.log('设置总用户数:', totalCount);

      setUsers(userData);
      setTotalUsers(totalCount);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setMessage({ type: 'error', text: '获取用户列表失败' });
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === UserStatus.NORMAL ? UserStatus.DISABLED : UserStatus.NORMAL;
      await api.admin.updateUserStatus(userId, newStatus);
      setMessage({
        type: 'success',
        text: newStatus === UserStatus.NORMAL ? '用户已启用' : '用户已禁用'
      });
      fetchUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('更新用户状态失败:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '更新用户状态失败'
      });
      setTimeout(() => setMessage(null), 3000);
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

  const getInitials = (username: string, nickname: string) => {
    const name = nickname || username || 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              返回控制台
            </Button>
            <div>
              <h1 className="text-3xl font-bold">用户管理</h1>
              <p className="text-muted-foreground">管理系统中的所有用户账户</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                  <p className="text-muted-foreground text-sm">总用户数</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.status === UserStatus.NORMAL).length}
                  </p>
                  <p className="text-muted-foreground text-sm">活跃用户</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {users.filter(u => u.status === UserStatus.DISABLED).length}
                  </p>
                  <p className="text-muted-foreground text-sm">已禁用</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Card className={`border-${message.type === 'success' ? 'green' : 'red'}-200 bg-${message.type === 'success' ? 'green' : 'red'}-50`}>
                <CardContent className="p-4 flex items-center gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                    {message.text}
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索用户名、邮箱或昵称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        <div className="grid gap-6">
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">暂无用户数据</p>
                  <p>
                    {searchTerm ? '没有找到匹配的用户' : '系统中还没有用户'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                              {getInitials(user.username || '', user.nickname || '')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {user.nickname || user.username}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getRoleBadgeVariant(user.role || 1)} className="text-xs">
                            {getRoleText(user.role || 1)}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(user.status || 1)} className="text-xs">
                            {getStatusText(user.status || 1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>ID: {user.id}</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {user.createTime ?
                              new Date(user.createTime).toLocaleDateString('zh-CN') :
                              '未知'
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={user.status === UserStatus.NORMAL ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user.id, user.status || 1)}
                          className="flex-1 flex items-center gap-1"
                        >
                          {user.status === UserStatus.NORMAL ? (
                            <>
                              <Ban className="w-4 h-4" />
                              禁用
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              启用
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalUsers > 12 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                第 {currentPage} 页，共 {Math.ceil(totalUsers / 12)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(totalUsers / 12)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};