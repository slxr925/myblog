import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRegisterDTO } from '../../types/api';
import { Role } from '../../types/api';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onClose?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState<UserRegisterDTO>({
    username: '',
    password: '',
    email: '',
    nickname: '',
    role: Role.USER,
  });
  const [errors, setErrors] = useState<Partial<UserRegisterDTO & { confirmPassword: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>(''); // 持久化错误消息


  const validateForm = (): boolean => {
    const newErrors: Partial<UserRegisterDTO & { confirmPassword: string }> = {};

    // 用户名验证
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3 || formData.username.length > 12) {
      newErrors.username = '用户名长度必须在3-12位之间';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '密码不能为空';
    } else if (formData.password.length < 8 || formData.password.length > 20) {
      newErrors.password = '密码长度必须在8-20位之间';
    } else if (!isPasswordStrong(formData.password)) {
      newErrors.password = '密码必须包含大小写字母、数字和特殊字符';
    }

    // 确认密码验证
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
    }

    // 邮箱验证
    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }

    // 昵称验证
    const nickname = formData.nickname || '';
    if (!nickname.trim()) {
      newErrors.nickname = '昵称不能为空';
    } else if (nickname.length > 12) {
      newErrors.nickname = '昵称长度不能超过12位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isPasswordStrong = (password: string): boolean => {
    // 检查密码强度：必须包含大小写字母、数字和特殊字符
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const isValidEmail = (email: string): boolean => {
    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(''); // 清除旧的错误消息
    try {
      await register(formData);
      setRegistrationSuccess(true);
      // 注册成功后不清除表单，保留用户信息方便登录
    } catch (error: any) {
      console.error('注册失败:', error);
      console.error('注册失败详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // 显示错误信息给用户（使用状态而不是alert）
      let displayMessage = '注册失败，请稍后重试';
      if (error.message) {
        displayMessage = error.message;
      }

      // 特殊处理429限流错误，显示更明显的提示
      if (error.status === 429 || error.isRateLimitError) {
        displayMessage = `⚠️ ${displayMessage}`;
      }

      setErrorMessage(displayMessage);
    } finally {
      setIsLoading(false);
    }
  };


  // 注册成功后跳转到登录界面
  const handleGoToLogin = () => {
    setRegistrationSuccess(false);
    onSwitchToLogin();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除对应字段的错误
    if (errors[name as keyof UserRegisterDTO]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // 清除确认密码的错误
    if (errors.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {registrationSuccess ? '注册成功' : '注册'}
          </CardTitle>
          <CardDescription className="text-center">
            {registrationSuccess
              ? '恭喜您注册成功！请使用您的账号密码登录'
              : '创建一个新账号来开始您的博客之旅'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationSuccess ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 font-medium">
                注册成功！您的账号已创建。
              </div>
              <div className="text-sm text-muted-foreground">
                用户名：{formData.username}
                <br />
                邮箱：{formData.email}
              </div>
              <Button
                onClick={handleGoToLogin}
                className="w-full"
              >
                立即登录
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  用户名 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名（3-12位）"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  邮箱 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium">
                  昵称 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="nickname"
                  name="nickname"
                  type="text"
                  placeholder="请输入昵称（最多12位）"
                  value={formData.nickname}
                  onChange={handleInputChange}
                  className={errors.nickname ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.nickname && (
                  <p className="text-sm text-red-500">{errors.nickname}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  密码 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="请输入密码（8-20位）"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  密码必须包含大小写字母、数字和特殊字符
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* 错误消息显示 */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </form>
          )}

          {!registrationSuccess && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                已有账号？{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary hover:underline font-medium"
                >
                  立即登录
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};