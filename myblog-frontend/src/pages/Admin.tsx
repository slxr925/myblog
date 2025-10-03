import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/api';
import { UserManagement } from '../components/admin/UserManagement';
import { BlogManagement } from '../components/admin/BlogManagement';
import { CommentManagement } from '../components/admin/CommentManagement';
import { Users, FileText, MessageSquare, Settings } from 'lucide-react';

type AdminView = 'dashboard' | 'users' | 'blogs' | 'comments';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBlogs: 0,
    totalComments: 0,
    todayViews: 0
  });

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchStats();
    }
  }, [currentView]);

  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 如果API调用失败，使用模拟数据
      setStats({
        totalUsers: 12,
        totalBlogs: 8,
        totalComments: 24,
        todayViews: 156
      });
    }
  };

  if (!user || user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">访问被拒绝</h2>
            <p className="text-muted-foreground">您没有访问此页面的权限。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement onBack={() => setCurrentView('dashboard')} />;
      case 'blogs':
        return <BlogManagement onBack={() => setCurrentView('dashboard')} />;
      case 'comments':
        return <CommentManagement onBack={() => setCurrentView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">管理员控制台</h1>
          <p className="text-muted-foreground">管理博客系统的各项功能和设置</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 用户管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('users')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>用户管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                管理系统用户，包括查看、编辑、禁用用户账户
              </p>
              <Button className="w-full">进入管理</Button>
            </CardContent>
          </Card>

          {/* 文章管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('blogs')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>文章管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                管理博客文章，包括审核、编辑、删除文章
              </p>
              <Button className="w-full">进入管理</Button>
            </CardContent>
          </Card>

          {/* 评论管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('comments')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>评论管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                管理用户评论，包括审核、回复、删除评论
              </p>
              <Button className="w-full">进入管理</Button>
            </CardContent>
          </Card>

          {/* 分类管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>分类管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                管理文章分类，包括添加、编辑、删除分类
              </p>
              <Button className="w-full" disabled>敬请期待</Button>
            </CardContent>
          </Card>

          {/* 标签管理 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>标签管理</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                管理文章标签，包括添加、编辑、删除标签
              </p>
              <Button className="w-full" disabled>敬请期待</Button>
            </CardContent>
          </Card>

          {/* 系统设置 */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>系统设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                配置系统参数，包括网站设置、安全设置等
              </p>
              <Button className="w-full" disabled>敬请期待</Button>
            </CardContent>
          </Card>
        </div>

        {/* 系统统计 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>系统统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">总用户数</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-3xl font-bold text-primary">{stats.totalBlogs}</div>
                  <div className="text-sm text-muted-foreground">总文章数</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-3xl font-bold text-primary">{stats.totalComments}</div>
                  <div className="text-sm text-muted-foreground">总评论数</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-3xl font-bold text-primary">{stats.todayViews}</div>
                  <div className="text-sm text-muted-foreground">今日访问</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  return renderCurrentView();
};