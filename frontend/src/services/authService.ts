// 认证服务
import axios from 'axios';
import Router from 'next/router';

// 使用相对路径，通过Next.js代理转发请求
const API_URL = '';

// 用户类型
export interface User {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
}

// 登录表单类型
export interface LoginForm {
  username: string;
  password: string;
  remember?: boolean;
}

// Token响应类型
export interface Token {
  access_token: string;
  token_type: string;
}

// 登录响应类型
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// 创建HTTP请求实例
const authClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,     // 设置超时时间为10秒
  withCredentials: true  // 设置跨域请求携带凭证
});

// Token相关功能

// 存储令牌到本地存储
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
};

// 从本地存储获取令牌
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// 清除令牌
export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
};

// 检查用户是否已认证
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// 存储当前用户信息
export const setCurrentUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('currentUser', JSON.stringify(user));
};

// 获取当前用户信息
export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('解析用户信息失败:', error);
      return null;
    }
  }
  return null;
};

// 清除用户信息
export const clearCurrentUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentUser');
};

// 认证相关API

// 登录
export const login = async (credentials: LoginForm): Promise<LoginResponse> => {
  try {
    console.log('尝试登录，API URL:', `${API_URL}/api/v1/auth/login`);

    // 使用URLSearchParams格式化表单数据
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await authClient.post<Token>('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('登录响应:', response.data);

    // 保存token
    setToken(response.data.access_token);
    
    // 获取用户信息
    const userResponse = await authClient.get('/users/me', {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
      },
    });
    
    // 保存用户信息
    setCurrentUser(userResponse.data);
    
    // 返回登录响应
    return {
      access_token: response.data.access_token,
      token_type: response.data.token_type,
      user: userResponse.data
    };
  } catch (error) {
    console.error('登录失败，详细错误:', error);
    if (axios.isAxiosError(error)) {
      console.error('请求配置:', error.config);
      console.error('请求URL:', error.config?.url);
      console.error('响应状态:', error.response?.status);
      console.error('响应数据:', error.response?.data);
    }
    throw error;
  }
};

// 注销
export const logout = (): void => {
  clearToken();
  clearCurrentUser();
  
  // 重定向到登录页
  Router.push('/login');
};

// 验证token是否有效
export const validateToken = async (): Promise<boolean> => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const response = await authClient.get('/users/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // 如果请求成功，更新用户信息
    setCurrentUser(response.data);
    return true;
  } catch (error) {
    console.error('验证Token失败:', error);
    
    // 如果是401或403错误，清除本地认证信息
    if (axios.isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
      clearToken();
      clearCurrentUser();
    }
    
    return false;
  }
};

// 处理认证错误和token过期
export const handleAuthError = (): void => {
  clearToken();
  clearCurrentUser();
  
  // 获取当前路径用于登录后重定向
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  const redirectPath = encodeURIComponent(currentPath);
  
  // 重定向到登录页，带上重定向信息
  Router.push(`/login?redirect=${redirectPath}`);
}; 