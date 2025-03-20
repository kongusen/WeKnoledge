import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { validateToken } from '@/services/authService';

// 无需认证即可访问的页面路径
const publicPaths = ['/login', '/register', '/forgot-password'];

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  useEffect(() => {
    // 全局认证状态检查，但排除公共页面
    const isPublicPath = publicPaths.some(path => router.pathname.startsWith(path));
    
    if (!isPublicPath) {
      // 验证令牌有效性
      validateToken().catch(() => {
        // 如果验证失败，不在这里处理，因为api.ts中的拦截器会处理
      });
    }
  }, [router.pathname]);
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          borderRadiusLG: 12,
          borderRadiusSM: 6
        },
        components: {
          Button: {
            borderRadius: 24,
            borderRadiusLG: 24,
            borderRadiusSM: 24
          },
          Input: {
            borderRadius: 12,
            borderRadiusLG: 16,
            borderRadiusSM: 8
          },
          Card: {
            borderRadius: 16
          },
          Modal: {
            borderRadius: 16,
            borderRadiusLG: 16
          }
        }
      }}
    >
      <Component {...pageProps} />
    </ConfigProvider>
  );
} 