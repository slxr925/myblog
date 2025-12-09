import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AuthErrorHandler: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthExpired = (event: CustomEvent) => {
      const { message: authMessage } = event.detail;
      setMessage(authMessage || '您的登录已过期，请重新登录');
      setShow(true);
    };

    // 监听认证过期事件
    window.addEventListener('auth:expired', handleAuthExpired as EventListener);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener);
    };
  }, []);

  const handleRelogin = async () => {
    // 关闭提示
    setShow(false);

    // 登出当前用户
    await logout();

    // 触发显示登录模态框的事件
    // 这需要与您的登录模态框实现相匹配
    window.dispatchEvent(new CustomEvent('auth:showLogin'));
  };

  const handleCancel = () => {
    setShow(false);
    // 导航到首页
    navigate('/');
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-lg text-orange-600">登录已过期</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{message}</p>
          <p className="text-sm text-gray-500">
            您之前正在浏览的页面是：{location.pathname}
          </p>
          <div className="flex space-x-2 pt-2">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              稍后登录
            </Button>
            <Button onClick={handleRelogin} className="flex-1">
              重新登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthErrorHandler;