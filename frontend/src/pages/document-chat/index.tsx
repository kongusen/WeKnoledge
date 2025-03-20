import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Input, Button, List, Avatar, Typography, Spin, Divider, Empty, message, 
  Upload, Card, Tabs, Drawer, Space, Tag
} from 'antd';
import { 
  SendOutlined, RobotOutlined, UserOutlined, UploadOutlined, 
  FileTextOutlined, FilePdfOutlined, InboxOutlined, DeleteOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import MainLayout from '@/components/layout/MainLayout';
import { getSystemConfig } from '@/services/configService';
import { getUserDocuments, uploadDocument, deleteDocumentFromLocal, getDocumentPreviewUrl } from '@/services/documentService';

const DocumentChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [systemConfig, setSystemConfig] = useState(getSystemConfig());
  const router = useRouter();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化欢迎消息
  useEffect(() => {
    // 如果没有消息，添加欢迎消息
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: `欢迎使用${systemConfig.systemName}的文档问答功能。您可以上传文档，然后向我提问关于文档内容的问题。`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);
  
  // 处理从首页传递的查询参数和文件
  useEffect(() => {
    const { q } = router.query;
    // 从URL查询参数获取问题
    if (typeof q === 'string' && q.trim() && documents.length > 0 && messages.length <= 1) {
      setInputValue(q);
      // 延迟发送，确保文档和欢迎消息已加载
      setTimeout(() => {
        handleSendMessage(q);
      }, 500);
    }

    // 从sessionStorage获取查询和文件
    const searchQuery = sessionStorage.getItem('searchQuery');
    const searchFilesStr = sessionStorage.getItem('searchFiles');
    
    // 如果有文件信息，处理文件上传
    if (searchFilesStr) {
      try {
        const filesInfo = JSON.parse(searchFilesStr);
        // 提示用户需要重新上传文件（因为我们无法通过sessionStorage传递实际文件内容）
        if (filesInfo.length > 0) {
          message.info('请上传您想要分析的文档');
        }
        // 清除sessionStorage中的文件信息
        sessionStorage.removeItem('searchFiles');
      } catch (error) {
        console.error('解析文件信息失败:', error);
      }
    }
    
    // 如果有查询，设置到输入框
    if (searchQuery && documents.length > 0 && messages.length <= 1) {
      setInputValue(searchQuery);
      // 清除sessionStorage中的查询
      sessionStorage.removeItem('searchQuery');
      // 延迟发送，确保文档已加载
      setTimeout(() => {
        handleSendMessage(searchQuery);
      }, 500);
    }
  }, [router.query, documents, messages]);
  
  // 添加消息后滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 加载用户文档
  useEffect(() => {
    // 从API或本地存储加载文档列表
    const loadDocuments = async () => {
      try {
        // 尝试从API加载
        const response = await getUserDocuments();
        if (response && response.data) {
          setDocuments(response.data);
        } else {
          // 如果API失败，从本地存储加载
          const savedDocuments = localStorage.getItem('userDocuments');
          if (savedDocuments) {
            try {
              const docs = JSON.parse(savedDocuments);
              setDocuments(docs);
            } catch (error) {
              console.error('无法解析文档列表:', error);
            }
          }
        }
      } catch (error) {
        console.error('加载文档失败:', error);
        // 从本地存储加载
        const savedDocuments = localStorage.getItem('userDocuments');
        if (savedDocuments) {
          try {
            const docs = JSON.parse(savedDocuments);
            setDocuments(docs);
          } catch (error) {
            console.error('无法解析文档列表:', error);
          }
        }
      }
    };
    
    loadDocuments();
  }, []);
  
  // 发送消息
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue;
    if (!messageContent.trim()) return;
    
    // 验证是否有可用文档
    if (documents.length === 0) {
      message.warning('请先上传至少一个文档，然后再开始提问');
      return;
    }
    
    // 检查文档是否已处理完成
    const readyDocuments = documents.filter(doc => doc.status === 'ready');
    if (readyDocuments.length === 0) {
      message.warning('文档正在处理中，请稍后再试');
      return;
    }
    
    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      type: 'user',
      timestamp: new Date()
    };
    
    // 添加用户消息到列表
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    
    try {
      // TODO: 调用后端API获取回复
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟回复（带文档引用）
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `这是对"${messageContent}"的回复，基于您上传的文档。在实际实现中，这将来自后端API，并包含文档中的相关信息。`,
        type: 'assistant',
        timestamp: new Date(),
        references: documents.length > 0 ? [
          {
            documentId: documents[0].id,
            documentName: documents[0].name,
            pageNumber: 1,
            excerpt: "这是从文档中提取的相关段落，用于支持回答。在实际实现中，这将是文档中的真实内容。"
          }
        ] : undefined
      };
      
      // 添加助手回复到列表
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('无法获取回复:', error);
      message.error('获取回复失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <MainLayout 
      pageTitle="文档问答" 
      breadcrumbs={[{ path: '/', title: '首页' }, { path: '/document-chat', title: '文档问答' }]}
    >
      {/* ... existing code ... */}
    </MainLayout>
  );
};

export default DocumentChatPage; 