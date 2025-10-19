import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { User, AuthState, UserLoginDTO, UserRegisterDTO } from '../types/api';
import { Role } from '../types/api';
import { api } from '../utils/api';

// 认证状态类型
interface AuthContextType extends AuthState {
  login: (loginData: UserLoginDTO) => Promise<void>;
  register: (registerData: UserRegisterDTO) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// 认证操作类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// 认证状态reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        token: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    case 'REFRESH_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user, token },
          });
          
          // 验证token是否仍然有效
          await refreshUser();
        } catch (error) {
          console.error('初始化认证状态失败:', error);
          // 如果解析失败，清除无效的认证信息
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    };

    initAuth();
  }, []);

  // 用户登录
  const login = async (loginData: UserLoginDTO): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
            const response = await api.user.login(loginData);
            
      const token = response; // 响应拦截器已提取data部分，response直接是token字符串
      
      // 先保存token到localStorage，这样后续请求会自动添加Authorization头
      localStorage.setItem('token', token);
      
      // 获取用户信息
      try {
        const userResponse = await api.user.getCurrentUser();
        const user = userResponse; // 响应拦截器已处理，userResponse直接是User对象
        
        // 保存完整的认证信息
        api.auth.saveAuth(token, user);
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token },
        });
        
      } catch (userError) {
        console.error('AuthContext: 获取用户信息失败', userError);
        // 如果获取用户信息失败，仍然认为登录成功，但使用默认用户信息
        const defaultUser: User = {
          id: 0,
          username: loginData.username,
          email: '',
          status: 0,
          role: Role.USER
        };
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user: defaultUser, token },
        });
      }
    } catch (error: any) {
      console.error('AuthContext: 登录失败', error);
      
      // 如果登录失败，清除可能已保存的token
      localStorage.removeItem('token');
      
      let errorMessage = '登录失败，请检查用户名和密码';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // 用户注册
  const register = async (registerData: UserRegisterDTO): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      await api.user.register(registerData);
      
      // 注册成功后不自动登录，重置状态
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      console.error('AuthContext: 注册失败', error);
      
      let errorMessage = '注册失败，请稍后重试';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      dispatch({ type: 'LOGIN_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  // 用户登出
  const logout = async (): Promise<void> => {
    try {
      // 调用后端登出API
      await api.user.logout();
    } catch (error) {
      console.error('登出API调用失败:', error);
    } finally {
      // 清除前端认证信息
      api.auth.clearAuth();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // 刷新用户信息
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await api.user.getCurrentUser();
      const user = response.data;
      
      // 更新本地存储的用户信息
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'REFRESH_USER', payload: user });
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // 如果token无效，触发登出
      logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 使用认证上下文的hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};