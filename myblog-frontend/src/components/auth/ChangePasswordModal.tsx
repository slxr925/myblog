import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api } from '../../utils/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 密码强度验证函数（与注册时保持一致）
  const isPasswordStrong = (password: string): boolean => {
    // 检查密码强度：必须包含大小写字母、数字和特殊字符
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // 清除错误信息
    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      setPasswordError('');

      // 验证新密码和确认密码是否一致
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('新密码和确认密码不一致');
        return;
      }

      // 验证密码长度（与注册时保持一致）
      if (passwordData.newPassword.length < 8 || passwordData.newPassword.length > 20) {
        setPasswordError('密码长度必须在8-20位之间');
        return;
      }

      // 验证密码强度（与注册时保持一致）
      if (!isPasswordStrong(passwordData.newPassword)) {
        setPasswordError('密码必须包含大小写字母、数字和特殊字符');
        return;
      }

      await api.user.changePassword(passwordData);
      
      // 重置密码表单
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      alert('密码修改成功');
      onClose();
    } catch (error: any) {
      console.error('修改密码失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '修改密码失败，请稍后重试';
      setPasswordError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>修改密码</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              新密码必须包含大小写字母、数字和特殊字符，长度8-20位
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">当前密码</label>
              <Input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1"
                placeholder="请输入当前密码"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">新密码</label>
              <Input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`mt-1 ${passwordError ? 'border-red-500' : ''}`}
                placeholder="请输入新密码（8-20位）"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                密码必须包含大小写字母、数字和特殊字符
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">确认新密码</label>
              <Input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`mt-1 ${passwordError ? 'border-red-500' : ''}`}
                placeholder="请再次输入新密码"
                disabled={isLoading}
              />
            </div>
            
            {passwordError && (
              <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                {passwordError}
              </div>
            )}
            <div className="flex space-x-2">
              <Button 
                onClick={handleChangePassword} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? '修改中...' : '确认修改'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClose}
                disabled={isLoading}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};