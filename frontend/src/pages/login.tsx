import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/router';
import { login, isAuthenticated } from '@/services/authService';
import Link from 'next/link';
import { initSystemConfig, getLocalSystemConfig } from '@/services/configService';

const { Title } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [systemName, setSystemName] = useState<string>('WeKnowledge');
  const router = useRouter();
  const { redirect } = router.query;

  // 初始化系统配置并检查登录状态
  useEffect(() => {
    // 初始化系统配置
    initSystemConfig();
    const config = getLocalSystemConfig();
    setSystemName(config.systemName);
    document.title = `登录 - ${config.systemName}`;
    
    // 如果已经登录，重定向到首页或指定页面
    if (isAuthenticated()) {
      router.replace(typeof redirect === 'string' ? redirect : '/');
    }
  }, [redirect, router]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await login({
        username: values.username,
        password: values.password,
        remember: values.remember
      });

      message.success('登录成功');
      
      // 登录成功后重定向
      if (typeof redirect === 'string' && redirect) {
        router.push(redirect);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('登录失败:', error);
      message.error('用户名或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Title level={2} className="text-center">{systemName}</Title>
          <Title level={4} className="text-center">知识管理平台</Title>
        </div>
        
        <Card>
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入您的用户名' }]}
            >
              <Input 
                prefix={<UserOutlined className="site-form-item-icon" />} 
                placeholder="用户名" 
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入您的密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="密码"
              />
            </Form.Item>
            
            <Form.Item>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>

              <Link href="/forgot-password" className="float-right">
                忘记密码
              </Link>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login; 