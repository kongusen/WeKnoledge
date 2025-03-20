import React, { useEffect, useState, PropsWithChildren } from 'react';
import { useRouter } from 'next/router';
import { Spin, message } from 'antd';
import { getToken, validateToken } from '@/services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // 检查是否有token
        const token = getToken();
        if (!token) {
          // 没有token，重定向到登录页
          message.error('请先登录');
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }

        // 验证token是否有效
        const isValid = await validateToken();
        if (!isValid) {
          // token无效，重定向到登录页
          message.error('登录已过期，请重新登录');
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('认证检查失败:', error);
        message.error('认证失败，请重新登录');
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      } finally {
        setIsLoading(false);
      }
    };

    // 如果不是登录页面，检查认证
    if (router.pathname !== '/login') {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [router]);

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="正在加载..." />
      </div>
    );
  }

  // 如果已认证，渲染子组件
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute; 