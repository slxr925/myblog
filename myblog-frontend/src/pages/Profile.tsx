import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import MyComments from '../components/profile/MyComments';
import MyLikes from '../components/profile/MyLikes';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/api';
import { api } from '../utils/api';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { FileUpload } from '../components/upload/FileUpload';
import { User, Lock, Edit2, Save, X, Camera, FileText, Mail } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    bio: user?.bio || '',
  });

  React.useEffect(() => {
    setFormData({
      nickname: user?.nickname || '',
      email: user?.email || '',
      bio: user?.bio || '',
    });
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-foreground">请先登录</h2>
            <p className="text-muted-foreground">您需要登录后才能查看个人资料。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
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

  const handleAvatarUpload = async (url: string) => {
    try {
      setUploadingAvatar(true);
      await api.user.updateUserInfo({ avatar: url });
      await refreshUser();
      setShowAvatarUpload(false);
    } catch (error) {
      console.error('头像上传失败:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">我</h1>
          <p className="text-muted-foreground">管理您的个人信息和偏好设置</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  基本信息
                </CardTitle>
                <CardDescription>更新您的头像和个人详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* 头像 */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={user.avatar || '/default-avatar.png'} alt={user.nickname} />
                      <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                        {(user.nickname || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full shadow-md h-8 w-8 bg-card hover:bg-muted"
                      onClick={() => setShowAvatarUpload(true)}
                      disabled={uploadingAvatar}
                    >
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{user.nickname || user.username}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary" className={user.role === Role.ADMIN ? "bg-indigo-100 text-indigo-700" : ""}>
                      {user.role === Role.ADMIN ? '管理员' : '普通用户'}
                    </Badge>
                    </div>
                  </div>
                </div>

                {showAvatarUpload && (
                  <div className="p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">上传新头像</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowAvatarUpload(false)}><X className="w-4 h-4" /></Button>
                    </div>
                    <FileUpload
                      accept="image/*"
                      maxSize={2}
                      type="image"
                      onUploadSuccess={handleAvatarUpload}
                      onUploadError={(e) => console.error(e)}
                      className="w-full"
                    />
                  </div>
                )}

                {/* 表单 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">用户名</label>
                    <Input value={user.username} disabled className="bg-slate-50" />
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">昵称</label>
                        <Input
                          name="nickname"
                      value={isEditing ? formData.nickname : (user.nickname || '未设置')} 
                      disabled={!isEditing}
                          onChange={handleInputChange}
                      className={!isEditing ? "bg-muted/30" : ""}
                        />
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">邮箱</label>
                        <Input
                          name="email"
                      value={isEditing ? formData.email : user.email} 
                      disabled={!isEditing}
                          onChange={handleInputChange}
                      className={!isEditing ? "bg-muted/30" : ""}
                        />
                    </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">注册时间</label>
                      <Input
                      value={user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'} 
                        disabled
                      className="bg-slate-50"
                      />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground">个人简介</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        placeholder="介绍一下你自己..."
                      />
                    ) : (
                      <div className="p-3 bg-muted/30 rounded-md text-sm text-muted-foreground min-h-[80px]">
                        {user.bio || '这个人很懒，什么都没写。'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" /> 保存更改
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>取消</Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> 编辑资料
                      </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧：Tabs 内容 */}
          <div className="xl:col-span-2">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">个人中心</CardTitle>
                <CardDescription>查看您的评论、喜爱内容和账户信息</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="account">账户状态</TabsTrigger>
                    <TabsTrigger value="comments">我的评论</TabsTrigger>
                    <TabsTrigger value="likes">我的喜爱</TabsTrigger>
                  </TabsList>

                  <TabsContent value="account" className="space-y-4">
                    <div className="p-4 bg-muted/30 rounded-xl">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground text-sm">当前状态</span>
                        <Badge variant={user.status === 0 ? 'default' : 'destructive'}>
                          {user.status === 0 ? '正常' : '异常'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground text-sm">账户类型</span>
                        <Badge variant="secondary" className={user.role === Role.ADMIN ? "bg-indigo-100 text-indigo-700" : ""}>
                          {user.role === Role.ADMIN ? '管理员' : '普通用户'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground text-sm">注册时间</span>
                        <span className="text-sm font-medium">
                          {user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-muted-foreground text-sm">最后登录</span>
                        <span className="text-sm font-medium">
                          {user.updateTime ? new Date(user.updateTime).toLocaleDateString('zh-CN') : '近期'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-xl space-y-3">
                      <h4 className="font-medium text-foreground mb-3">快捷操作</h4>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => navigate('/blog/drafts')}
                      >
                        <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> 我的草稿
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => setIsChangingPassword(true)}
                      >
                        <Lock className="w-4 h-4 mr-2 text-muted-foreground" /> 修改密码
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="comments">
                    <MyComments />
                  </TabsContent>

                  <TabsContent value="likes">
                    <MyLikes />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
    </motion.div>
  );
};

export default Profile;