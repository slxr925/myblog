import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/api';
import { api } from '../utils/api';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { Home, User, Mail, Lock, Edit2, Save, X } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  // 当用户信息更新时，同步更新表单数据
  React.useEffect(() => {
    setFormData({
      nickname: user?.nickname || '',
      email: user?.email || '',
      bio: user?.bio || '',
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">请先登录</h2>
            <p className="text-gray-600">您需要登录后才能查看个人资料。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      console.log('保存用户信息:', formData);
      await api.user.updateUserInfo(formData);
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      nickname: user.nickname || '',
      email: user.email || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* 导航栏 */}
      <nav className="relative z-50 p-6">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-xl max-w-7xl mx-auto shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-bold text-gray-800">个人资料</h1>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-700 hover:bg-gray-100" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                首页
              </Button>
            </nav>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">个人资料</h1>
          <p className="text-xl text-gray-600">管理您的个人信息和设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息卡片 */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  基本信息
                </CardTitle>
                <CardDescription>
                  管理您的基本账户信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 用户头像和基本信息 */}
                <div className="flex items-center space-x-6">
                  <Avatar className="h-24 w-24 border-2 border-gray-200">
                    <AvatarImage src={user.avatar || '/default-avatar.png'} alt={user.nickname || user.username} />
                    <AvatarFallback className="text-2xl">
                      {(user.nickname || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-800">{user.nickname || user.username}</h3>
                    <p className="text-gray-600 mb-2">{user.email}</p>
                    <Badge variant={user.role === Role.ADMIN ? 'default' : 'secondary'} className="mt-1">
                      {user.role === Role.ADMIN ? '管理员' : '普通用户'}
                    </Badge>
                  </div>
                </div>

                {/* 表单字段 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
                      <Input value={user.username} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">昵称</label>
                      {isEditing ? (
                        <Input
                          name="nickname"
                          value={formData.nickname}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      ) : (
                        <Input value={user.nickname || '未设置'} disabled className="bg-gray-50" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">邮箱</label>
                      {isEditing ? (
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-blue-500"
                        />
                      ) : (
                        <Input value={user.email} disabled className="bg-gray-50" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">注册时间</label>
                      <Input
                        value={user.createTime ? new Date(user.createTime).toLocaleString('zh-CN') : '未知'}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">个人简介</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-3 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-blue-500 focus:ring-2"
                        placeholder="请输入个人简介"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-600 min-h-[100px]">
                        {user.bio || '未设置个人简介'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        保存
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑资料
                      </Button>
                      <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        <Lock className="w-4 h-4 mr-2" />
                        修改密码
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：账户信息 */}
          <div className="space-y-6">
            {/* 账户信息卡片 */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">状态</span>
                  <Badge variant={user.status === 0 ? 'default' : 'destructive'}>
                    {user.status === 0 ? '正常' : '已禁用'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">角色</span>
                  <span className="font-medium text-gray-800">{user.role === Role.ADMIN ? '管理员' : '普通用户'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">最后更新</span>
                  <span className="text-gray-800">{user.updateTime ? new Date(user.updateTime).toLocaleDateString('zh-CN') : '未知'}</span>
                </div>
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => navigate('/')}>
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setIsChangingPassword(true)}>
                  <Lock className="w-4 h-4 mr-2" />
                  修改密码
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 修改密码模态框 */}
      <ChangePasswordModal
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
    </motion.div>
  );
};

export default Profile;