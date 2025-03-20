import React, { ReactNode, useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Badge, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  BookOutlined,
  SearchOutlined,
  FileTextOutlined,
  EditOutlined,
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  AppstoreOutlined,
  ClusterOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getCurrentUser, logout } from '@/services/authService';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children: ReactNode;
  userRole?: 'user' | 'admin';
  requireAuth?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  userRole = 'user',
  requireAuth = true
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const isAdmin = userRole === 'admin';
  const [username, setUsername] = useState<string>('用户');

  // 获取当前用户信息
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUsername(user.username);
    }
  }, []);

  // 处理登出
  const handleLogout = () => {
    logout();
    message.success('已成功登出');
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: <Link href="/profile">个人中心</Link>,
    },
    {
      key: 'logout',
      label: <a onClick={handleLogout}>退出登录</a>,
    },
  ];
  
  // 基础菜单项 - 所有用户可见
  const baseMenuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    {
      key: '/knowledge',
      icon: <BookOutlined />,
      label: <Link href="/knowledge">知识库</Link>,
      children: [
        {
          key: '/knowledge/personal',
          label: <Link href="/knowledge/personal">个人知识库</Link>,
        },
        {
          key: '/knowledge/organization',
          label: <Link href="/knowledge/organization">组织知识库</Link>,
        },
      ]
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link href="/history">历史提问</Link>,
    },
  ];
  
  // 管理员特有菜单
  const adminMenuItems = [
    {
      key: '/admin',
      icon: <SettingOutlined />,
      label: '管理后台',
      children: [
        {
          key: '/admin/dashboard',
          icon: <DashboardOutlined />,
          label: <Link href="/admin/dashboard">仪表板</Link>,
        },
        {
          key: '/admin/organization',
          icon: <TeamOutlined />,
          label: <Link href="/admin/organization">组织管理</Link>,
        },
        {
          key: '/admin/knowledge-config',
          icon: <SettingOutlined />,
          label: <Link href="/admin/knowledge-config">知识库配置</Link>,
        },
        {
          key: '/admin/settings',
          icon: <AppstoreOutlined />,
          label: <Link href="/admin/settings">基础配置</Link>,
        },
      ],
    },
  ];
  
  // 根据用户角色合并菜单项
  const menuItems = isAdmin ? [...baseMenuItems, ...adminMenuItems] : baseMenuItems;

  // 渲染布局
  const renderLayout = () => (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div className="p-4 h-16 flex items-center">
          <h1 className={`text-xl font-bold ${collapsed ? 'hidden' : ''}`}>WeKnowledge</h1>
          <div className={`${collapsed ? 'block' : 'hidden'}`}>WK</div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[router.pathname]}
          defaultOpenKeys={['/knowledge', '/admin']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="bg-white p-0 flex justify-between items-center px-4">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="text-lg"
          />
          <div className="flex items-center">
            <Badge dot={true} className="mr-4">
              <Button shape="circle" icon={<SearchOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <span className="cursor-pointer">
                <Avatar icon={<UserOutlined />} className="mr-2" />
                <span className={collapsed ? 'hidden' : ''}>{username}</span>
              </span>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg">
          {children}
        </Content>
      </Layout>
    </Layout>
  );

  // 如果需要认证，则包装在ProtectedRoute中
  return requireAuth ? (
    <ProtectedRoute>
      {renderLayout()}
    </ProtectedRoute>
  ) : (
    renderLayout()
  );
};

export default MainLayout; 