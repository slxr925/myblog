import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import type { UserLoginDTO } from '../../types/api';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onClose }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState<UserLoginDTO>({
    username: '',
    password: '',
    captchaId: '',
    captchaCode: '',
  });
  const [errors, setErrors] = useState<Partial<UserLoginDTO>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 验证码相关状态
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // 加载验证码
  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const { captchaId, imageBase64 } = await api.captcha.generate();
      setCaptchaImage(imageBase64);
      setFormData(prev => ({ ...prev, captchaId, captchaCode: '' }));
    } catch (error) {
      console.error('获取验证码失败:', error);
    } finally {
      setCaptchaLoading(false);
    }
  };

  // 组件挂载时加载验证码
  useEffect(() => {
    loadCaptcha();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserLoginDTO> = {};

    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空';
    } else if (formData.username.length < 3 || formData.username.length > 20) {
      newErrors.username = '用户名长度必须在3-20位之间';
    }

    if (!formData.password) {
      newErrors.password = '密码不能为空';
    }

    if (!formData.captchaCode?.trim()) {
      newErrors.captchaCode = '请输入验证码';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
      toast.success('登录成功');
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      // 显示错误信息给用户
      let errorMessage = '登录失败，请检查用户名和密码';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // 根据错误消息判断是验证码错误还是密码错误
      const isCaptchaError = errorMessage.includes('验证码');
      if (isCaptchaError) {
        setErrors({ captchaCode: errorMessage });
      } else {
        setErrors({ password: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // 清除对应字段的错误
    if (errors[name as keyof UserLoginDTO]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
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
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">
            请输入您的用户名和密码进行登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                用户名
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="请输入用户名"
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
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="captcha" className="text-sm font-medium">
                验证码
              </label>
              <div className="flex gap-2">
                <Input
                  id="captcha"
                  name="captchaCode"
                  type="text"
                  placeholder="请输入验证码"
                  value={formData.captchaCode}
                  onChange={handleInputChange}
                  maxLength={4}
                  className={errors.captchaCode ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                <div
                  className="flex-shrink-0 cursor-pointer border rounded overflow-hidden hover:opacity-80 transition-opacity"
                  onClick={loadCaptcha}
                  title="点击刷新验证码"
                >
                  {captchaLoading ? (
                    <div className="w-[120px] h-[40px] flex items-center justify-center bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <img
                      src={captchaImage}
                      alt="验证码"
                      className="w-[120px] h-[40px] select-none"
                    />
                  )}
                </div>
              </div>
              {errors.captchaCode && (
                <p className="text-sm text-red-500">{errors.captchaCode}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              还没有账号？{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-primary hover:underline font-medium"
              >
                立即注册
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};