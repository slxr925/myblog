import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Role, type AdminStatsDTO, BlogStatus } from '../types/api';
import { api } from '../utils/api';
import { UserManagement } from '../components/admin/UserManagement';
import { BlogManagement } from '../components/admin/BlogManagement';
import { CommentManagement } from '../components/admin/CommentManagement';
import { CategoryManagement } from '../components/admin/CategoryManagement';
import { TagManagement } from '../components/admin/TagManagement';
import { ActivityChart } from '../components/charts/ActivityChart';
import {
  Users, FileText, MessageSquare, Settings, ThumbsUp, Eye, TrendingUp,
  Calendar, FolderOpen, Hash, LogOut, LayoutDashboard, RefreshCcw
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

type AdminView = 'dashboard' | 'users' | 'blogs' | 'comments' | 'categories' | 'tags';

const ADMIN_VIEWS: AdminView[] = ['dashboard', 'users', 'blogs', 'comments', 'categories', 'tags'];

const isValidAdminView = (value: string | null): value is AdminView => {
  return value !== null && ADMIN_VIEWS.includes(value as AdminView);
};

const parseStatusParam = (value: string | null): BlogStatus | undefined => {
  if (!value) return undefined;
  switch (value.toLowerCase()) {
    case 'draft': return BlogStatus.DRAFT;
    case 'published': return BlogStatus.PUBLISHED;
    case 'offline': return BlogStatus.OFFLINE;
    default: return undefined;
  }
};

export const Admin: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [initialBlogStatus, setInitialBlogStatus] = useState<BlogStatus | undefined>(undefined);
  const [stats, setStats] = useState<AdminStatsDTO>({
    totalUsers: 0, totalBlogs: 0, totalComments: 0, totalLikes: 0,
    todayViews: 0, todayNewUsers: 0, todayNewBlogs: 0, todayNewComments: 0,
    weeklyStats: [], monthlyStats: []
  });

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchStats();
      api.admin.trackVisit('/admin/dashboard').catch(console.warn);
    }
  }, [currentView]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const statusParam = params.get('status');

    if (isValidAdminView(tabParam) && tabParam !== currentView) {
      setCurrentView(tabParam);
    }
    setInitialBlogStatus(parseStatusParam(statusParam));
  }, [location.search]);

  const fetchStats = async () => {
    try {
      const response = await api.admin.getStats();
      setStats(response);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('退出登录失败', error);
    }
  };

  if (!user || user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">访问被拒绝</h2>
            <p className="text-muted-foreground mb-6">您没有访问此页面的权限。</p>
            <Button onClick={() => navigate('/')} className="w-full">返回首页</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: "控制台" },
    { id: 'blogs', icon: FileText, label: "文章管理" },
    { id: 'comments', icon: MessageSquare, label: "评论管理" },
    { id: 'categories', icon: FolderOpen, label: "分类管理" },
    { id: 'tags', icon: Hash, label: "标签管理" },
    { id: 'users', icon: Users, label: "用户管理" },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'users': return <UserManagement onBack={() => setCurrentView('dashboard')} />;
      case 'blogs': return <BlogManagement onBack={() => setCurrentView('dashboard')} initialStatusFilter={initialBlogStatus} />;
      case 'comments': return <CommentManagement onBack={() => setCurrentView('dashboard')} />;
      case 'categories': return <CategoryManagement onBack={() => setCurrentView('dashboard')} />;
      case 'tags': return <TagManagement onBack={() => setCurrentView('dashboard')} />;
      default: return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "总用户数", value: stats.totalUsers, change: `+${stats.todayNewUsers}`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "总文章数", value: stats.totalBlogs, change: `+${stats.todayNewBlogs}`, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "总评论数", value: stats.totalComments, change: `+${stats.todayNewComments}`, icon: MessageSquare, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "总点赞数", value: stats.totalLikes, change: "累计", icon: ThumbsUp, color: "text-pink-600", bg: "bg-pink-50" },
        ].map((stat, index) => (
          <div key={index} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-green-600 dark:text-green-400 text-sm font-semibold bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">{stat.change}</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-muted-foreground text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={stats.weeklyStats} title="最近7天活跃度" showLegend={true} />
        <ActivityChart data={stats.monthlyStats} title="最近30天活跃度" showLegend={true} />
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" /> 数据概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-center mb-2 text-indigo-600">
                <Eye className="w-6 h-6 mr-2" />
                <span className="text-3xl font-bold">{stats.todayViews}</span>
              </div>
              <div className="text-sm text-muted-foreground">今日访问量</div>
            </div>
            {/* More detailed stats can be added here */}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar border-r border-sidebar-border fixed h-full z-10 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border h-20">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
          <span className="text-xl font-bold text-sidebar-foreground">RyanAdmin</span>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id as AdminView);
                navigate(`/dashboard?tab=${item.id}`);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${currentView === item.id
                ? "bg-sidebar-accent text-sidebar-primary font-medium shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground cursor-not-allowed hover:bg-sidebar-accent/50">
              <Settings className="w-5 h-5" />
              系统设置
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {menuItems.find(i => i.id === currentView)?.label}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">欢迎回来，{user?.nickname || '管理员'}</p>
          </div>
          <div className="flex items-center gap-4">

            <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
              返回前台
            </Button>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
              {(user?.nickname || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div >
    </div >
  );
};
