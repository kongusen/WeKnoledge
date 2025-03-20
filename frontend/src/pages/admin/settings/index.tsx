import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Card, 
  Tabs, 
  Space, 
  Row, 
  Col, 
  message, 
  Divider,
  Switch,
  Collapse,
  Select
} from 'antd';
import { 
  UploadOutlined, 
  SaveOutlined, 
  PlusOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  HomeOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  FormOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { CollapseProps } from 'antd';
import { getSystemConfig, updateSystemConfig, updatePartialSystemConfig, SystemConfig, HomeCard } from '@/services/configService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Panel } = Collapse;

// 获取Ant Design图标列表（简化版）
const iconOptions = [
  'BarChartOutlined',
  'SearchOutlined', 
  'BookOutlined', 
  'RobotOutlined', 
  'FileOutlined', 
  'FileTextOutlined', 
  'EditOutlined',
  'TeamOutlined', 
  'UserOutlined', 
  'AppstoreOutlined',
  'SettingOutlined', 
  'CloudOutlined', 
  'DatabaseOutlined',
];

const SettingsPage: React.FC = () => {
  const [basicForm] = Form.useForm();
  const [cardsForm] = Form.useForm();
  const [seoForm] = Form.useForm();
  const [logoFile, setLogoFile] = useState<UploadFile | null>(null);
  const [faviconFile, setFaviconFile] = useState<UploadFile | null>(null);
  const [loginBgFile, setLoginBgFile] = useState<UploadFile | null>(null);
  const [homeCards, setHomeCards] = useState<HomeCard[]>([]);
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  // 初始化配置数据
  useEffect(() => {
    const config = getSystemConfig();
    setSystemConfig(config);
    setHomeCards(config.homeCards);

    basicForm.setFieldsValue({
      systemName: config.systemName,
      systemDescription: config.systemDescription,
      footerText: config.footerText,
    });
    
    cardsForm.setFieldsValue({
      cards: config.homeCards,
    });
  }, [basicForm, cardsForm]);

  // 标志文件已存在的自定义请求函数
  const customRequest = ({ file, onSuccess }: any) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  // 保存基础配置
  const saveBasicConfig = () => {
    basicForm.validateFields().then(values => {
      if (!systemConfig) return;

      // 更新配置
      const updatedConfig = {
        ...systemConfig,
        systemName: values.systemName,
        systemDescription: values.systemDescription,
        footerText: values.footerText,
      };

      // 如果有新上传的Logo文件，模拟处理（实际项目中应该上传到服务器）
      if (logoFile) {
        // 这里假设文件已上传并返回URL
        updatedConfig.logoUrl = URL.createObjectURL(logoFile as any);
      }

      // 如果有新上传的Favicon文件
      if (faviconFile) {
        updatedConfig.faviconUrl = URL.createObjectURL(faviconFile as any);
      }

      // 如果有新上传的登录背景
      if (loginBgFile) {
        updatedConfig.loginBackground = URL.createObjectURL(loginBgFile as any);
      }

      // 保存配置
      updateSystemConfig(updatedConfig);
      setSystemConfig(updatedConfig);
      message.success('基础配置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 保存首页卡片配置
  const saveCardsConfig = () => {
    cardsForm.validateFields().then(values => {
      if (!systemConfig) return;
      
      const updatedCards = values.cards as HomeCard[];
      
      // 更新配置
      const updatedConfig = {
        ...systemConfig,
        homeCards: updatedCards,
      };

      // 保存配置
      updateSystemConfig(updatedConfig);
      setSystemConfig(updatedConfig);
      setHomeCards(updatedCards);
      message.success('首页卡片配置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // 保存SEO设置
  const saveSeoConfig = () => {
    seoForm.validateFields().then(values => {
      message.success('SEO设置已保存');
    }).catch(error => {
      console.log('表单验证失败:', error);
    });
  };

  // Logo上传前处理
  const beforeLogoUpload = (file: UploadFile) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml';
    if (!isJpgOrPng) {
      message.error('仅支持JPG/PNG/SVG格式的图片!');
      return false;
    }
    const isLt2M = (file.size || 0) / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片必须小于2MB!');
      return false;
    }
    setLogoFile(file);
    return false;
  };

  // Favicon上传前处理
  const beforeFaviconUpload = (file: UploadFile) => {
    const isIco = file.type === 'image/x-icon' || file.type === 'image/png';
    if (!isIco) {
      message.error('仅支持ICO/PNG格式的图标!');
      return false;
    }
    const isLt1M = (file.size || 0) / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error('图标必须小于1MB!');
      return false;
    }
    setFaviconFile(file);
    return false;
  };

  // 登录背景上传前处理
  const beforeLoginBgUpload = (file: UploadFile) => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error('请上传图片文件!');
      return false;
    }
    const isLt5M = (file.size || 0) / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片必须小于5MB!');
      return false;
    }
    setLoginBgFile(file);
    return false;
  };

  // 添加新卡片
  const addNewCard = () => {
    const newCard = {
      id: Date.now().toString(),
      title: '新功能卡片',
      description: '请输入卡片描述文本',
      icon: 'AppstoreOutlined',
      link: '/',
      enabled: true,
    };
    
    const newCards = [...homeCards, newCard];
    setHomeCards(newCards);
    cardsForm.setFieldsValue({ cards: newCards });
  };

  // 删除卡片
  const removeCard = (cardId: string) => {
    const newCards = homeCards.filter(card => card.id !== cardId);
    setHomeCards(newCards);
    cardsForm.setFieldsValue({ cards: newCards });
  };

  // 预览系统配置
  const previewSettings = () => {
    // 在新窗口打开首页
    window.open('/', '_blank');
  };

  if (!systemConfig) return null;

  return (
    <MainLayout userRole="admin">
      <div className="mb-6">
        <Title level={2}>基础配置</Title>
        <p className="text-gray-500">设置系统基本信息和首页展示内容</p>
      </div>

      <Card className="mb-6">
        <div className="flex justify-end mb-4">
          <Button 
            type="primary" 
            icon={<EyeOutlined />} 
            onClick={previewSettings}
          >
            预览配置效果
          </Button>
        </div>

        <Tabs 
          defaultActiveKey="basic" 
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
        >
          {/* 基础信息配置 */}
          <TabPane 
            tab={
              <span>
                <GlobalOutlined />
                基础信息
              </span>
            } 
            key="basic"
          >
            <Form
              form={basicForm}
              layout="vertical"
              initialValues={{
                systemName: systemConfig.systemName,
                systemDescription: systemConfig.systemDescription,
                footerText: systemConfig.footerText,
              }}
            >
              <Collapse defaultActiveKey={['1', '2', '3']} className="mb-6">
                <Panel header="系统标识配置" key="1">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="systemName"
                        label="系统名称"
                        rules={[{ required: true, message: '请输入系统名称' }]}
                        extra="显示在浏览器标题、系统页眉和登录页面"
                      >
                        <Input placeholder="请输入系统名称" maxLength={30} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="系统Logo"
                        extra="建议尺寸: 180 x 40px，支持PNG/JPG/SVG格式"
                      >
                        <Upload
                          listType="picture"
                          maxCount={1}
                          beforeUpload={beforeLogoUpload}
                          customRequest={customRequest}
                          defaultFileList={[
                            {
                              uid: '-1',
                              name: 'logo.png',
                              status: 'done',
                              url: systemConfig.logoUrl,
                            },
                          ]}
                        >
                          <Button icon={<UploadOutlined />}>更换Logo</Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        name="systemDescription"
                        label="系统简介"
                        rules={[{ required: true, message: '请输入系统简介' }]}
                        extra="显示在首页，简要介绍系统功能"
                      >
                        <TextArea 
                          placeholder="请输入系统简介" 
                          rows={4} 
                          maxLength={200} 
                          showCount 
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="网站图标 (Favicon)"
                        extra="显示在浏览器标签，建议尺寸: 32 x 32px"
                      >
                        <Upload
                          listType="picture"
                          maxCount={1}
                          beforeUpload={beforeFaviconUpload}
                          customRequest={customRequest}
                          defaultFileList={[
                            {
                              uid: '-1',
                              name: 'favicon.ico',
                              status: 'done',
                              url: systemConfig.faviconUrl,
                            },
                          ]}
                        >
                          <Button icon={<UploadOutlined />}>更换图标</Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                </Panel>

                <Panel header="登录页面配置" key="2">
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item
                        label="登录背景图"
                        extra="建议尺寸: 1920 x 1080px，支持JPG/PNG格式"
                      >
                        <Upload
                          listType="picture"
                          maxCount={1}
                          beforeUpload={beforeLoginBgUpload}
                          customRequest={customRequest}
                          defaultFileList={[
                            {
                              uid: '-1',
                              name: 'login-bg.jpg',
                              status: 'done',
                              url: systemConfig.loginBackground,
                            },
                          ]}
                        >
                          <Button icon={<UploadOutlined />}>更换背景图</Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>
                </Panel>

                <Panel header="页面底部配置" key="3">
                  <Form.Item
                    name="footerText"
                    label="页脚文本"
                    extra="显示在页面底部的版权或其他信息"
                  >
                    <Input placeholder="请输入页脚文本" />
                  </Form.Item>
                </Panel>
              </Collapse>

              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveBasicConfig}
                >
                  保存基础配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 首页卡片配置 */}
          <TabPane 
            tab={
              <span>
                <HomeOutlined />
                首页配置
              </span>
            } 
            key="homeCards"
          >
            <Form
              form={cardsForm}
              layout="vertical"
            >
              <div className="mb-4 flex justify-between items-center">
                <Text>配置首页显示的功能卡片，支持添加、编辑、排序和启用/禁用</Text>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={addNewCard}
                >
                  添加卡片
                </Button>
              </div>

              <div className="mb-6">
                {homeCards.map((card, index) => (
                  <Card 
                    key={card.id} 
                    className="mb-4" 
                    title={`卡片 ${index + 1}`}
                    extra={
                      <Button 
                        danger 
                        type="text" 
                        icon={<DeleteOutlined />} 
                        onClick={() => removeCard(card.id)}
                        disabled={homeCards.length <= 1}
                      >
                        删除
                      </Button>
                    }
                  >
                    <Form.Item
                      name={['cards', index, 'enabled']}
                      valuePropName="checked"
                      initialValue={card.enabled}
                      className="mb-4"
                    >
                      <Switch checkedChildren="已启用" unCheckedChildren="已禁用" />
                    </Form.Item>

                    <Row gutter={24}>
                      <Col span={12}>
                        <Form.Item
                          name={['cards', index, 'title']}
                          label="卡片标题"
                          initialValue={card.title}
                          rules={[{ required: true, message: '请输入卡片标题' }]}
                        >
                          <Input placeholder="请输入卡片标题" maxLength={20} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={['cards', index, 'icon']}
                          label="卡片图标"
                          initialValue={card.icon}
                          rules={[{ required: true, message: '请选择卡片图标' }]}
                        >
                          <Select placeholder="请选择图标">
                            {iconOptions.map(icon => (
                              <Select.Option key={icon} value={icon}>
                                {icon}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name={['cards', index, 'description']}
                      label="卡片描述"
                      initialValue={card.description}
                      rules={[{ required: true, message: '请输入卡片描述' }]}
                    >
                      <TextArea 
                        placeholder="请输入卡片描述" 
                        rows={2} 
                        maxLength={100} 
                        showCount 
                      />
                    </Form.Item>

                    <Form.Item
                      name={['cards', index, 'link']}
                      label="链接地址"
                      initialValue={card.link}
                      rules={[{ required: true, message: '请输入链接地址' }]}
                    >
                      <Input 
                        placeholder="请输入链接地址，如 /knowledge" 
                        addonBefore="/"
                      />
                    </Form.Item>

                    <Form.Item
                      hidden
                      name={['cards', index, 'id']}
                      initialValue={card.id}
                    >
                      <Input />
                    </Form.Item>
                  </Card>
                ))}
              </div>

              <Form.Item>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveCardsConfig}
                >
                  保存首页配置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* SEO配置 */}
          <TabPane 
            tab={
              <span>
                <FormOutlined />
                SEO设置
              </span>
            } 
            key="seo"
          >
            <Card>
              <p className="text-gray-500 mb-4">配置网站的搜索引擎优化参数，提高网站在搜索引擎中的可见性</p>
              <Form
                form={seoForm}
                layout="vertical"
              >
                <Form.Item
                  label="Meta标题"
                  name="metaTitle"
                  extra="显示在搜索结果中的标题，建议不超过70个字符"
                >
                  <Input placeholder="请输入Meta标题" maxLength={70} showCount />
                </Form.Item>
                
                <Form.Item
                  label="Meta描述"
                  name="metaDescription"
                  extra="显示在搜索结果中的描述，建议不超过160个字符"
                >
                  <TextArea 
                    placeholder="请输入Meta描述" 
                    rows={3} 
                    maxLength={160} 
                    showCount 
                  />
                </Form.Item>
                
                <Form.Item
                  label="Meta关键词"
                  name="metaKeywords"
                  extra="用逗号分隔多个关键词"
                >
                  <Input placeholder="关键词1,关键词2,关键词3" />
                </Form.Item>
                
                <Form.Item>
                  <Button type="primary" icon={<SaveOutlined />} onClick={saveSeoConfig}>保存SEO设置</Button>
                </Form.Item>
              </Form>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </MainLayout>
  );
};

export default SettingsPage; 