import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/api';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getRoleText = (role: number) => {
    return role === Role.ADMIN ? '管理员' : '普通用户';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 用户信息卡片 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>用户信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">用户名</label>
                  <p className="text-lg">{user?.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">邮箱</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">昵称</label>
                  <p className="text-lg">{user?.nickname || '未设置'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">角色</label>
                  <p className="text-lg">{user ? getRoleText(user.role) : ''}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">状态</label>
                  <p className={`text-lg ${user?.status === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.status === 0 ? '正常' : '已禁用'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">注册时间</label>
                  <p className="text-lg">
                    {user?.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'}
                  </p>
                </div>
              </div>
              
              {user?.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">个人简介</label>
                  <p className="text-lg mt-1">{user.bio}</p>
                </div>
              )}
              
              <div className="pt-4">
                <Button onClick={handleLogout} variant="destructive">
                  退出登录
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 快速操作卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                编辑个人资料
              </Button>
              <Button className="w-full" variant="outline">
                修改密码
              </Button>
              <Button className="w-full" variant="outline">
                我的文章
              </Button>
              <Button className="w-full" variant="outline">
                我的收藏
              </Button>
            </CardContent>
          </Card>

          {/* 统计信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>统计信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">文章数</div>
                </div>
                <div className="p-4 bg-muted rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">评论数</div>
                </div>
                <div className="p-4 bg-muted rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">点赞数</div>
                </div>
                <div className="p-4 bg-muted rounded">
                  <div className="text-2xl font-bold">0</div>
                  <div className="text-sm text-muted-foreground">收藏数</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 管理员功能卡片 */}
          {user?.role === Role.ADMIN && (
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>管理员功能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20">
                    用户管理
                  </Button>
                  <Button variant="outline" className="h-20">
                    文章管理
                  </Button>
                  <Button variant="outline" className="h-20">
                    分类管理
                  </Button>
                  <Button variant="outline" className="h-20">
                    系统设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
};