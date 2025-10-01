import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: number; // 可选：需要的角色权限
  redirectTo?: string; // 可选：重定向路径
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/',
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 如果正在加载认证状态，显示加载动画
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 如果用户未认证，重定向到首页并传递参数显示认证模态框
  if (!isAuthenticated) {
    const redirectPath = redirectTo === '/login' ? '/?fromProtected=true' : redirectTo;
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // 如果需要特定角色权限，检查用户角色
  if (requiredRole !== undefined && user && user.role < requiredRole) {
    // 用户角色权限不足，重定向到首页或无权限页面
    return <Navigate to="/" replace />;
  }

  // 认证通过，渲染子组件
  return <>{children}</>;
};