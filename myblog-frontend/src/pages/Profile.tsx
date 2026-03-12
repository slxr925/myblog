import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Checkbox } from '../components/ui/checkbox';
import { Separator } from '../components/ui/separator';
import MyComments from '../components/profile/MyComments';
import MyLikes from '../components/profile/MyLikes';
import MyCollections from '../components/profile/MyCollections';
import CollectionsManager from '../components/profile/CollectionsManager';
import MyFollowers from '../components/profile/MyFollowers';
import MyFollowing from '../components/profile/MyFollowing';
import MyBrowseHistory from '../components/profile/MyBrowseHistory';
import { useAuth } from '../contexts/AuthContext';
import { NotificationSettingVO, Role, type UserSessionVO } from '../types/api';
import { api } from '../utils/api';
import { ChangePasswordModal } from '../components/auth/ChangePasswordModal';
import { FileUpload } from '../components/upload/FileUpload';
import { User, Lock, Edit2, Save, X, Camera, FileText, Shield, BellRing, Newspaper, Monitor } from 'lucide-react';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingVO = {
  userId: 0,
  enableComment: true,
  enableLike: true,
  enableFollow: true,
  enableCollection: true,
  enableSystem: true,
  enableNewArticle: true,
  enableMention: true,
  enableStats: true,
  enableWeeklyDigest: true,
  enableWebsocket: true,
  enableBrowser: true,
  enableAll: true,
};

const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [sessions, setSessions] = useState<UserSessionVO[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingVO>(DEFAULT_NOTIFICATION_SETTINGS);
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false);
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

  React.useEffect(() => {
    api.user.getSessions()
      .then(data => {
        // 按设备名称+IP+浏览器去重，只保留最新的会话
        const uniqueSessions = data.reduce((acc, session) => {
          const key = `${session.deviceInfo || ''}-${session.ip || ''}-${session.browser || ''}`;
          if (!acc[key] || new Date(session.lastSeen || 0) > new Date(acc[key].lastSeen || 0)) {
            acc[key] = session;
          }
          return acc;
        }, {} as Record<string, typeof data[0]>);
        setSessions(Object.values(uniqueSessions));
      })
      .catch(() => setSessions([]));
  }, []);

  React.useEffect(() => {
    if (!user) {
      return;
    }

    api.notification.getSettings()
      .then((settings) => {
        setNotificationSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...settings,
          userId: settings.userId || user.id,
        });
      })
      .catch(() => {
        setNotificationSettings({
          ...DEFAULT_NOTIFICATION_SETTINGS,
          userId: user.id,
        });
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
      const payload: any = { ...formData };
      if (formData.email !== user.email) {
        const currentPassword = window.prompt('修改邮箱需要当前密码');
        if (!currentPassword) {
          return;
        }
        payload.currentPassword = currentPassword;
      }
      await api.user.updateUserInfo(payload);
      await refreshUser();
      setIsEditing(false);
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await api.user.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (error) {
      console.error('下线会话失败:', error);
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

  const handleToggleNotificationSetting = async (key: keyof NotificationSettingVO, value: boolean) => {
    const previous = notificationSettings;
    const next = { ...notificationSettings, [key]: value };

    if (key === 'enableAll' && !value) {
      next.enableNewArticle = false;
      next.enableWeeklyDigest = false;
      next.enableBrowser = false;
    }

    if (key !== 'enableAll' && value) {
      next.enableAll = true;
    }

    setNotificationSettings(next);
    setSavingNotificationSettings(true);

    try {
      await api.notification.updateSettings(next);
    } catch (error) {
      console.error('更新通知设置失败:', error);
      setNotificationSettings(previous);
    } finally {
      setSavingNotificationSettings(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background py-12"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8 border border-border bg-card px-6 py-8 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-border bg-background text-accent">
              <User className="h-5 w-5" />
            </div>
            <p className="font-mono-display text-[11px] uppercase tracking-[0.28em] text-accent">Personal Desk</p>
          </div>
          <h1 className="text-editorial-xl text-foreground">个人中心</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            统一管理身份信息、订阅偏好、互动记录与设备会话。
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* 左侧：个人信息 */}
          <div className="xl:col-span-1 space-y-6">
            <Card className="border-border bg-card shadow-none rounded-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  基本信息
                </CardTitle>
                <CardDescription>更新您的头像和个人详细信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* 头像 */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-24 w-24 border border-border shadow-sm">
                      <AvatarImage src={user.avatar || '/default-avatar.png'} alt={user.nickname} />
                      <AvatarFallback className="text-2xl bg-muted text-foreground">
                        {(user.nickname || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full border border-border bg-card shadow-sm hover:bg-muted"
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
                      <Badge variant="secondary" className={user.role === Role.ADMIN ? "bg-primary/10 text-primary" : ""}>
                        {user.role === Role.ADMIN ? '管理员' : '普通用户'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {showAvatarUpload && (
                  <div className="border border-border bg-background px-4 py-4">
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
                    <Input value={user.username} disabled className="bg-muted/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">昵称</label>
                    <Input
                      name="nickname"
                      value={isEditing ? formData.nickname : (user.nickname || '未设置')}
                      disabled={!isEditing}
                      onChange={handleInputChange}
                      className={!isEditing ? "bg-muted/20" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">邮箱</label>
                    <Input
                      name="email"
                      value={isEditing ? formData.email : user.email}
                      disabled={!isEditing}
                      onChange={handleInputChange}
                      className={!isEditing ? "bg-muted/20" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">注册时间</label>
                    <Input
                      value={user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'}
                      disabled
                      className="bg-muted/20"
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
                        className="w-full rounded-none border border-border bg-background px-3 py-2 text-sm text-foreground transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="介绍一下你自己..."
                      />
                    ) : (
                      <div className="min-h-[80px] border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                        {user.bio || '这个人很懒，什么都没写。'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 border-t border-border pt-4">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} className="rounded-none">
                        <Save className="w-4 h-4 mr-2" /> 保存更改
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="rounded-none">取消</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => setIsEditing(true)} className="rounded-none">
                        <Edit2 className="w-4 h-4 mr-2" /> 编辑资料
                      </Button>
                      <Button variant="outline" onClick={() => setIsChangingPassword(true)} className="rounded-none">
                        <Lock className="w-4 h-4 mr-2" /> 修改密码
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none rounded-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-accent" />
                  订阅偏好
                </CardTitle>
                <CardDescription>管理新文章提醒、每周摘要与浏览器推送</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    { key: 'enableAll', icon: BellRing, title: '总开关', description: '关闭后将暂停所有订阅提醒' },
                    { key: 'enableNewArticle', icon: FileText, title: '新文章提醒', description: '关注的作者发布新文章时提醒我' },
                    { key: 'enableWeeklyDigest', icon: Newspaper, title: '每周摘要', description: '每周一汇总过去 7 天的新文章' },
                    { key: 'enableBrowser', icon: Monitor, title: '浏览器通知', description: '允许浏览器桌面提醒' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.key} className="flex items-start justify-between gap-4 border border-border bg-background px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center border border-border text-accent">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <Checkbox
                          checked={Boolean(notificationSettings[item.key as keyof NotificationSettingVO])}
                          disabled={savingNotificationSettings}
                          onCheckedChange={(checked) =>
                            handleToggleNotificationSetting(item.key as keyof NotificationSettingVO, Boolean(checked))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  当前实现为站内订阅与 RSS 引导，不包含邮件发送链路。
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-none rounded-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  登录设备
                </CardTitle>
                <CardDescription>管理当前登录会话</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground">暂无会话记录</div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.sessionId} className="flex items-start justify-between gap-3 border border-border bg-background p-3">
                        <div>
                          <div className="font-medium text-foreground">{session.deviceLabel || '未知设备'}</div>
                          <div className="text-xs text-muted-foreground">
                            {session.ip || '未知IP'} · {session.lastSeen ? new Date(session.lastSeen).toLocaleString('zh-CN') : '未知时间'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.sessionId)}
                          disabled={session.status === 1}
                          className="rounded-none"
                        >
                          {session.status === 1 ? '已下线' : '下线'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：Tabs 内容 */}
          <div className="xl:col-span-2">
            <Card className="border-border bg-card shadow-none rounded-none">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-lg">个人中心</CardTitle>
                <CardDescription>查看您的评论、喜爱内容和账户信息</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="account" className="w-full">
                  {/* 移动端：左右布局 */}
                  <div className="flex gap-4 sm:hidden items-start">
                    <TabsList className="sticky top-4 flex h-auto w-28 shrink-0 flex-col gap-1 self-start rounded-none border border-border bg-background p-1">
                      <TabsTrigger value="account" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">账户状态</TabsTrigger>
                      <TabsTrigger value="comments" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">我的评论</TabsTrigger>
                      <TabsTrigger value="likes" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">我的喜爱</TabsTrigger>
                      <TabsTrigger value="collections" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">我的收藏</TabsTrigger>
                      <TabsTrigger value="browse-history" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">浏览记录</TabsTrigger>
                      <TabsTrigger value="followers" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">我的粉丝</TabsTrigger>
                      <TabsTrigger value="following" className="justify-start rounded-none px-2 text-xs font-mono-display uppercase tracking-[0.16em]">我关注的</TabsTrigger>
                    </TabsList>
                    <div className="flex-1 min-w-0 text-xs">
                      <TabsContent value="account" className="space-y-2 mt-0">
                        <div className="border border-border bg-muted/20 p-2">
                          <div className="flex justify-between items-center py-1.5 border-b border-border">
                            <span className="text-muted-foreground">状态</span>
                            <Badge variant={user.status === 0 ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                              {user.status === 0 ? '正常' : '异常'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-border">
                            <span className="text-muted-foreground">类型</span>
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${user.role === Role.ADMIN ? "bg-primary/10 text-primary" : ""}`}>
                              {user.role === Role.ADMIN ? '管理员' : '用户'}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-muted-foreground">注册</span>
                            <span className="font-medium">{user.createTime ? new Date(user.createTime).toLocaleDateString('zh-CN') : '未知'}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-full justify-start rounded-none text-xs" onClick={() => navigate('/blog/drafts')}>
                          <FileText className="w-3 h-3 mr-1.5" /> 我的草稿
                        </Button>
                      </TabsContent>
                      <TabsContent value="comments" className="mt-0"><MyComments /></TabsContent>
                      <TabsContent value="likes" className="mt-0"><MyLikes /></TabsContent>
                      <TabsContent value="collections" className="mt-0"><CollectionsManager /></TabsContent>
                      <TabsContent value="browse-history" className="mt-0"><MyBrowseHistory /></TabsContent>
                      <TabsContent value="followers" className="mt-0"><MyFollowers /></TabsContent>
                      <TabsContent value="following" className="mt-0"><MyFollowing /></TabsContent>
                    </div>
                  </div>

                  {/* 桌面端：保持原样横向布局 */}
                  <div className="hidden sm:block">
                    <TabsList className="grid w-full grid-cols-7 rounded-none border border-border bg-background p-1">
                      <TabsTrigger value="account" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">账户状态</TabsTrigger>
                      <TabsTrigger value="comments" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">我的评论</TabsTrigger>
                      <TabsTrigger value="likes" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">我的喜爱</TabsTrigger>
                      <TabsTrigger value="collections" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">我的收藏</TabsTrigger>
                      <TabsTrigger value="browse-history" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">浏览记录</TabsTrigger>
                      <TabsTrigger value="followers" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">我的粉丝</TabsTrigger>
                      <TabsTrigger value="following" className="rounded-none font-mono-display text-[11px] uppercase tracking-[0.18em]">我关注的</TabsTrigger>
                    </TabsList>

                    <TabsContent value="account" className="space-y-4">
                      <div className="border border-border bg-muted/20 p-4">
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground text-sm">当前状态</span>
                          <Badge variant={user.status === 0 ? 'default' : 'destructive'}>
                            {user.status === 0 ? '正常' : '异常'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground text-sm">账户类型</span>
                          <Badge variant="secondary" className={user.role === Role.ADMIN ? "bg-primary/10 text-primary" : ""}>
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
                      <div className="border border-border bg-muted/20 p-4">
                        <h4 className="font-medium text-foreground mb-3">快捷操作</h4>
                        <Button variant="outline" className="w-full justify-start rounded-none" onClick={() => navigate('/blog/drafts')}>
                          <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> 我的草稿
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="comments"><MyComments /></TabsContent>
                    <TabsContent value="likes"><MyLikes /></TabsContent>
                    <TabsContent value="collections"><CollectionsManager /></TabsContent>
                    <TabsContent value="browse-history"><MyBrowseHistory /></TabsContent>
                    <TabsContent value="followers"><MyFollowers /></TabsContent>
                    <TabsContent value="following"><MyFollowing /></TabsContent>
                  </div>
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
