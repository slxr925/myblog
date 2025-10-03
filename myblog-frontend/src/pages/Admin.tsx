import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Role, type AdminStatsDTO } from '../types/api';
import { api } from '../utils/api';
import { UserManagement } from '../components/admin/UserManagement';
import { BlogManagement } from '../components/admin/BlogManagement';
import { CommentManagement } from '../components/admin/CommentManagement';
import { ActivityChart } from '../components/charts/ActivityChart';
import { Users, FileText, MessageSquare, Settings, ThumbsUp, Eye, TrendingUp, Calendar } from 'lucide-react';

type AdminView = 'dashboard' | 'users' | 'blogs' | 'comments';

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [stats, setStats] = useState<AdminStatsDTO>({
    totalUsers: 0,
    totalBlogs: 0,
    totalComments: 0,
    totalLikes: 0,
    todayViews: 0,
    todayNewUsers: 0,
    todayNewBlogs: 0,
    todayNewComments: 0,
    weeklyStats: [],
    monthlyStats: []
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
        totalUsers: 0,
        totalBlogs: 0,
        totalComments: 0,
        totalLikes: 0,
        todayViews: 0,
        todayNewUsers: 0,
        todayNewBlogs: 0,
        todayNewComments: 0,
        weeklyStats: [],
        monthlyStats: []
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
              {/* 总体统计 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.totalUsers}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">总用户数</div>
                  <div className="text-xs text-green-600 mt-1">+{stats.todayNewUsers} 今日新增</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.totalBlogs}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">总文章数</div>
                  <div className="text-xs text-green-600 mt-1">+{stats.todayNewBlogs} 今日新增</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.totalComments}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">总评论数</div>
                  <div className="text-xs text-green-600 mt-1">+{stats.todayNewComments} 今日新增</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsUp className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.totalLikes}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">总点赞数</div>
                </div>
              </div>

              {/* 今日统计 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  今日活跃度
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="w-5 h-5 text-blue-600 mr-2" />
                      <div className="text-2xl font-bold text-blue-600">{stats.todayNewUsers}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">今日新用户</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded">
                    <div className="flex items-center justify-center mb-2">
                      <FileText className="w-5 h-5 text-green-600 mr-2" />
                      <div className="text-2xl font-bold text-green-600">{stats.todayNewBlogs}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">今日新文章</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded">
                    <div className="flex items-center justify-center mb-2">
                      <MessageSquare className="w-5 h-5 text-orange-600 mr-2" />
                      <div className="text-2xl font-bold text-orange-600">{stats.todayNewComments}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">今日新评论</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 活跃度趋势图表 */}
        <div className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 最近7天活跃度 */}
            <ActivityChart
              data={stats.weeklyStats}
              title="最近7天活跃度"
              showLegend={true}
            />

            {/* 最近30天活跃度 */}
            <ActivityChart
              data={stats.monthlyStats}
              title="最近30天活跃度"
              showLegend={true}
            />
          </div>
        </div>

        {/* 详细数据概览 */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>数据概览</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <Eye className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.todayViews}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">今日访问量</div>
                  <div className="text-xs text-muted-foreground mt-1">暂未实现统计</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsUp className="w-6 h-6 text-primary mr-2" />
                    <div className="text-3xl font-bold text-primary">{stats.totalLikes}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">总点赞数</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-lg font-semibold text-primary mb-1">7天总计</div>
                  <div className="text-2xl font-bold text-primary">
                    {stats.weeklyStats.reduce((sum, item) => sum + item.newUsers, 0) +
                     stats.weeklyStats.reduce((sum, item) => sum + item.newBlogs, 0) +
                     stats.weeklyStats.reduce((sum, item) => sum + item.newComments, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">新增内容</div>
                </div>
                <div className="text-center p-4 bg-muted rounded">
                  <div className="text-lg font-semibold text-primary mb-1">30天总计</div>
                  <div className="text-2xl font-bold text-primary">
                    {stats.monthlyStats.reduce((sum, item) => sum + item.newUsers, 0) +
                     stats.monthlyStats.reduce((sum, item) => sum + item.newBlogs, 0) +
                     stats.monthlyStats.reduce((sum, item) => sum + item.newComments, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">新增内容</div>
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