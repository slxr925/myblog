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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">请先登录</h2>
            <p className="text-muted-foreground">您需要登录后才能查看个人资料。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      console.log('保存用户信息:', formData);
      await api.user.updateUserInfo(formData);
      
      // 刷新认证上下文中的用户信息
      await refreshUser();
      
      setIsEditing(false);
    } catch (error) {
      console.error('保存用户信息失败:', error);
      alert('保存失败，请稍后重试');
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
      className="min-h-screen bg-background"
    >
      {/* 导航栏 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.h1
              className="text-2xl font-bold text-foreground"
              whileHover={{ scale: 1.05 }}
            >
              个人资料
            </motion.h1>
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                首页
              </Button>
            </nav>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">个人资料</h1>
          <p className="text-muted-foreground">管理您的个人信息和设置</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>
                  管理您的基本账户信息
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar || '/default-avatar.png'} alt={user.nickname || user.username} />
                    <AvatarFallback className="text-xl">
                      {(user.nickname || user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.nickname || user.username}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <Badge variant={user.role === Role.ADMIN ? 'default' : 'secondary'} className="mt-1">
                      {user.role === Role.ADMIN ? '管理员' : '普通用户'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">用户名</label>
                    <Input value={user.username} disabled className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">昵称</label>
                    {isEditing ? (
                      <Input
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <Input value={user.nickname || '未设置'} disabled className="mt-1" />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">邮箱</label>
                    {isEditing ? (
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <Input value={user.email} disabled className="mt-1" />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium">注册时间</label>
                    <Input 
                      value={user.createTime ? new Date(user.createTime).toLocaleString('zh-CN') : '未知'} 
                      disabled 
                      className="mt-1" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">个人简介</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full mt-1 p-2 border border-input rounded-md text-sm"
                      placeholder="请输入个人简介"
                    />
                  ) : (
                    <Input value={user.bio || '未设置'} disabled className="mt-1" />
                  )}
                </div>

                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave}>保存</Button>
                      <Button variant="outline" onClick={handleCancel}>取消</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)}>编辑资料</Button>
                      <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
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
            <Card>
              <CardHeader>
                <CardTitle>账户信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <Badge variant={user.status === 0 ? 'default' : 'destructive'}>
                    {user.status === 0 ? '正常' : '已禁用'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">角色</span>
                  <span>{user.role === Role.ADMIN ? '管理员' : '普通用户'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最后更新</span>
                  <span>{user.updateTime ? new Date(user.updateTime).toLocaleDateString('zh-CN') : '未知'}</span>
                </div>
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