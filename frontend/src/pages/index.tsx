import React, { useState, useEffect } from 'react';
import { Input, Button, Tooltip, message, Card, Row, Col } from 'antd';
import { useRouter } from 'next/router';
import { 
  SearchOutlined, 
  FileTextOutlined, 
  EditOutlined,
  SendOutlined, 
  FileAddOutlined,
  PictureOutlined,
  BarChartOutlined,
  BookOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
  TeamOutlined,
  UserOutlined,
  RobotOutlined,
  CloudOutlined,
  SettingOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import IntegratedSearch from '@/components/features/search/IntegratedSearch';
import MainLayout from '@/components/layout/MainLayout';
import { getLocalSystemConfig, SystemConfig, initSystemConfig } from '@/services/configService';

type SearchMode = 'global' | 'document' | 'writing';

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  BarChartOutlined: <BarChartOutlined />,
  SearchOutlined: <SearchOutlined />,
  BookOutlined: <BookOutlined />,
  RobotOutlined: <RobotOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  EditOutlined: <EditOutlined />,
  TeamOutlined: <TeamOutlined />,
  UserOutlined: <UserOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  SettingOutlined: <SettingOutlined />,
  CloudOutlined: <CloudOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
};

export default function Home() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 确保有初始配置
    initSystemConfig();
    // 获取配置
    const systemConfig = getLocalSystemConfig();
    setConfig(systemConfig);
    // 设置页面标题
    document.title = systemConfig.systemName;
  }, []);

  // 处理搜索逻辑，根据不同模式导航到对应页面
  const handleSearch = (query: string, files?: UploadFile[], mode?: SearchMode) => {
    console.log('Search query:', query);
    console.log('Uploaded files:', files);
    console.log('Search mode:', mode);
    
    // 将查询和文件信息保存到sessionStorage，以便在目标页面获取
    sessionStorage.setItem('searchQuery', query);
    if (files && files.length > 0) {
      // 注意：这里只保存文件信息，不是实际文件内容
      sessionStorage.setItem('searchFiles', JSON.stringify(files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type,
        uid: f.uid
      }))));
    }
    
    // 根据不同的搜索模式导航到对应页面
    switch(mode) {
      case 'global':
        // 导航到全局问答页面并传递查询参数
        router.push({
          pathname: '/chat',
          query: { q: query }
        });
        break;
      case 'document':
        // 导航到文档问答页面
        router.push({
          pathname: '/document-chat',
          query: { q: query }
        });
        break;
      case 'writing':
        // 导航到智能写作页面
        router.push({
          pathname: '/writing',
          query: { q: query }
        });
        break;
      default:
        message.success(`搜索提交成功: ${mode || 'global'} 模式`);
    }
  };

  // 处理卡片点击
  const handleCardClick = (link: string) => {
    if (link === '/analytics') {
      message.info('数据分析功能即将推出，敬请期待！');
      return;
    }
    
    // 使用Next.js路由导航，为平滑过渡做准备
    router.push(link);
  };

  if (!config) return null;

  // 过滤出启用的卡片
  const enabledCards = config.homeCards.filter(card => card.enabled);

  return (
    <MainLayout userRole="admin">
      <div className="flex flex-col items-center justify-center py-8">
        <h1 className="text-4xl font-bold mb-8 text-center">{config.systemName}</h1>
        <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl">
          {config.systemDescription}
        </p>
        
        <div className="w-full max-w-3xl">
          <IntegratedSearch onSearch={handleSearch} />
        </div>

        {enabledCards.length > 0 && (
          <div className="mt-16 flex justify-center flex-wrap gap-8">
            {enabledCards.map(card => (
              <div 
                key={card.id}
                className="flex flex-col items-center w-64 border rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleCardClick(card.link)}
              >
                <div className="text-4xl text-blue-500 mb-4">
                  {iconMap[card.icon] || <AppstoreOutlined />}
                </div>
                <div className="font-bold text-xl mb-2">{card.title}</div>
                <div className="text-sm text-gray-500 text-center whitespace-pre-wrap mb-4">
                  {card.description}
                </div>
                <Button 
                  type="default" 
                  className="mt-auto" 
                  disabled={card.link === '/analytics'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(card.link);
                  }}
                >
                  {card.link === '/analytics' ? '即将推出' : '立即使用'}
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 w-full text-center text-gray-500 py-6 border-t">
          {config.footerText}
        </div>
      </div>
    </MainLayout>
  );
} 