// 系统配置类型定义
export interface HomeCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  link: string;
  enabled: boolean;
}

export interface SystemConfig {
  systemName: string;
  systemDescription: string;
  logoUrl: string;
  faviconUrl: string;
  loginBackground: string;
  footerText: string;
  homeCards: HomeCard[];
}

// 默认配置
const defaultConfig: SystemConfig = {
  systemName: 'WeKnowledge 智能知识管理平台',
  systemDescription: '提供智能搜索、文档解读和智能写作，让知识管理更高效',
  logoUrl: '/images/logo.png',
  faviconUrl: '/images/favicon.ico',
  loginBackground: '/images/login-bg.jpg',
  footerText: '© 2023 WeKnowledge 智能知识库. All rights reserved.',
  homeCards: [
    {
      id: '1',
      title: '数据分析',
      description: '查看系统使用情况和数据统计',
      icon: 'BarChartOutlined',
      link: '/analytics',
      enabled: true,
    }
  ],
};

// 尝试从localStorage获取配置，如果不存在则使用默认配置
const getInitialConfig = (): SystemConfig => {
  if (typeof window === 'undefined') return defaultConfig;
  
  const storedConfig = localStorage.getItem('systemConfig');
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig);
    } catch (error) {
      console.error('解析存储的配置失败:', error);
      return defaultConfig;
    }
  }
  return defaultConfig;
};

// 获取系统配置
export const getSystemConfig = (): SystemConfig => {
  return getInitialConfig();
};

// 重命名为getLocalSystemConfig，保持与其他文件一致
export const getLocalSystemConfig = (): SystemConfig => {
  return getInitialConfig();
};

// 更新系统配置
export const updateSystemConfig = (config: SystemConfig): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('systemConfig', JSON.stringify(config));
  
  // 更新页面标题
  document.title = config.systemName;
  
  // 可以在这里添加更新favicon的逻辑
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = config.faviconUrl;
  }
};

// 更新部分系统配置
export const updatePartialSystemConfig = (partialConfig: Partial<SystemConfig>): void => {
  const currentConfig = getSystemConfig();
  updateSystemConfig({
    ...currentConfig,
    ...partialConfig,
  });
};

// 初始化，确保有默认配置
export const initSystemConfig = (): void => {
  const currentConfig = getSystemConfig();
  // 如果没有配置，则存储默认配置
  if (!currentConfig) {
    updateSystemConfig(defaultConfig);
  }
}; 