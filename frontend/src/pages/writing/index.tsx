import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Input, Button, Dropdown, Card, Typography, Space, Menu, message, 
  Drawer, Select, Radio, Form, Tabs, Modal, Tooltip, Spin, Divider
} from 'antd';
import { 
  EditOutlined, RobotOutlined, SaveOutlined, DownloadOutlined, 
  FileTextOutlined, BulbOutlined, SettingOutlined, SendOutlined,
  HistoryOutlined, FormOutlined, PlusOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined, MenuOutlined, GlobalOutlined
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { getSystemConfig } from '@/services/configService';
import { 
  getWritingDocumentsFromLocal, 
  saveWritingDocumentToLocal, 
  deleteWritingDocumentFromLocal,
  useAIAssist
} from '@/services/writingService';

const WritingPage: React.FC = () => {
  const [document, setDocument] = useState<Document>({
    id: Date.now().toString(),
    title: '无标题文档',
    content: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'article'
  });
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('business');
  const [writingLength, setWritingLength] = useState<WritingLength>('medium');
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [promptType, setPromptType] = useState<PromptType>('improve');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [systemConfig, setSystemConfig] = useState(getSystemConfig());
  const router = useRouter();
  
  const textAreaRef = useRef<any>(null);
  
  // 处理从首页传递的查询参数
  useEffect(() => {
    const { q } = router.query;
    if (typeof q === 'string' && q.trim()) {
      // 如果有查询参数，创建新文档并设置标题为查询内容
      const newDoc: Document = {
        id: Date.now().toString(),
        title: q.length > 20 ? q.substring(0, 20) + '...' : q,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'article'
      };
      
      setDocument(newDoc);
      setCustomPrompt(`请生成一篇关于"${q}"的${writingLength === 'short' ? '简短' : writingLength === 'medium' ? '中等长度' : '详细'}${writingStyle}文档`);
      
      // 自动打开AI辅助模态框
      setTimeout(() => {
        setPromptType('custom');
        setShowAIModal(true);
      }, 1000);
    }
    
    // 从sessionStorage获取查询
    const searchQuery = sessionStorage.getItem('searchQuery');
    if (searchQuery && !q) {
      // 如果有查询，创建新文档并设置标题
      const newDoc: Document = {
        id: Date.now().toString(),
        title: searchQuery.length > 20 ? searchQuery.substring(0, 20) + '...' : searchQuery,
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'article'
      };
      
      setDocument(newDoc);
      setCustomPrompt(`请生成一篇关于"${searchQuery}"的${writingLength === 'short' ? '简短' : writingLength === 'medium' ? '中等长度' : '详细'}${writingStyle}文档`);
      
      // 清除sessionStorage中的查询
      sessionStorage.removeItem('searchQuery');
      
      // 自动打开AI辅助模态框
      setTimeout(() => {
        setPromptType('custom');
        setShowAIModal(true);
      }, 1000);
    }
  }, [router.query]);
  
  // 加载保存的文档
  useEffect(() => {
    const savedDocuments = getWritingDocumentsFromLocal();
    if (savedDocuments && savedDocuments.length > 0) {
      setDocuments(savedDocuments);
      
      // 如果没有查询参数，加载第一个文档
      if (!router.query.q && !sessionStorage.getItem('searchQuery')) {
        setDocument(savedDocuments[0]);
      }
    }
  }, [router.query]);
  
  // 自动保存
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.content.trim()) {
        saveDocument();
      }
    }, 30000); // 每30秒自动保存一次
    
    return () => clearInterval(interval);
  }, [document]);
  
  // ... existing code (saveDocument, createNewDocument, etc.) ...
  
  // 修改handleAIAssist函数接收查询参数
  const handleAIAssist = async (initialQuery?: string) => {
    // 如果是初始查询（从首页传递过来的），使用自定义提示
    if (initialQuery && promptType === 'custom') {
      setLoading(true);
      
      try {
        // TODO: 调用后端API获取AI回复
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 模拟初始查询的回复
        const aiResponse = `这是关于"${initialQuery}"的${writingStyle}风格文档内容...\n\n在实际实现中，这里会是AI根据您的要求生成的完整内容。可能包括介绍、主体内容和总结等部分，取决于您选择的文档类型和风格。`;
        
        // 直接应用AI回复到文档
        setDocument({...document, content: aiResponse});
        setShowAIModal(false);
        
        // 保存文档
        saveDocument();
        
        message.success('文档已生成');
      } catch (error) {
        console.error('AI辅助写作失败:', error);
        message.error('AI辅助写作失败，请重试');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // 原有逻辑处理常规AI辅助请求
    if (!selectedText && promptType !== 'continue') {
      message.warning('请先选择一段文本');
      return;
    }
    
    setLoading(true);
    
    try {
      // 准备提示文本
      let promptText = '';
      
      switch (promptType) {
        case 'improve':
          promptText = `优化以下${writingStyle === 'academic' ? '学术' : 
                        writingStyle === 'business' ? '商务' : 
                        writingStyle === 'creative' ? '创意' : 
                        writingStyle === 'technical' ? '技术' : '对话'}风格的文本：\n\n${selectedText}`;
          break;
        case 'continue':
          const contextText = document.content.substring(
            Math.max(0, document.content.length - 500)
          );
          promptText = `继续${writingStyle === 'academic' ? '学术' : 
                        writingStyle === 'business' ? '商务' : 
                        writingStyle === 'creative' ? '创意' : 
                        writingStyle === 'technical' ? '技术' : '对话'}风格写作：\n\n${contextText}`;
          break;
        case 'summarize':
          promptText = `总结以下内容：\n\n${selectedText}`;
          break;
        case 'translate':
          promptText = `将以下内容翻译成英文：\n\n${selectedText}`;
          break;
        case 'custom':
          promptText = `${customPrompt}\n\n${selectedText}`;
          break;
      }
      
      // 调用AI辅助API
      try {
        // 在实际实现中，这会调用后端API
        const response = await useAIAssist({
          prompt_type: promptType,
          content: document.content,
          selected_text: selectedText,
          custom_prompt: customPrompt,
          writing_style: writingStyle,
          writing_length: writingLength
        });
        
        // 模拟API响应
        const aiResponse = response || promptType === 'improve'
          ? `这是优化后的${writingStyle}风格文本：\n\n${selectedText}（优化后的内容）`
          : promptType === 'continue'
          ? "这是AI继续写作的内容...（在实际实现中，这里会是AI生成的后续内容）"
          : promptType === 'summarize'
          ? "这是对所选内容的总结...（在实际实现中，这里会是AI生成的总结）"
          : promptType === 'translate'
          ? "This is the translated content... (In actual implementation, this would be the AI-generated translation)"
          : "这是自定义提示的回复...（在实际实现中，这里会是基于您自定义提示的AI生成内容）";
        
        // 处理AI回复
        procesaAIResponse(aiResponse);
      } catch (error) {
        throw error;
      }
    } catch (error) {
      console.error('AI辅助写作失败:', error);
      message.error('AI辅助写作失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 处理AI回复
  const procesaAIResponse = (aiResponse: string) => {
    if (promptType === 'continue') {
      // 在文档末尾添加内容
      const updatedContent = document.content + '\n\n' + aiResponse;
      setDocument({...document, content: updatedContent});
      setShowAIModal(false);
    } else {
      // 显示AI回复，让用户决定是否应用
      Modal.confirm({
        title: 'AI辅助结果',
        width: 700,
        content: (
          <div className="mt-4">
            <Paragraph>
              <Text strong>原文:</Text>
            </Paragraph>
            <Card className="bg-gray-50 mb-4">
              <Paragraph>{selectedText || '无选中文本'}</Paragraph>
            </Card>
            <Paragraph>
              <Text strong>AI生成结果:</Text>
            </Paragraph>
            <Card className="bg-blue-50">
              <Paragraph>{aiResponse}</Paragraph>
            </Card>
          </div>
        ),
        okText: '应用',
        cancelText: '取消',
        onOk: () => {
          // 如果是继续写作或没有选中文本，直接在末尾添加
          if (promptType === 'continue' || !selectedText) {
            const updatedContent = document.content + '\n\n' + aiResponse;
            setDocument({...document, content: updatedContent});
            return;
          }
          
          // 替换选中文本
          const currentContent = document.content;
          const selectionStart = currentContent.indexOf(selectedText);
          
          if (selectionStart >= 0) {
            const updatedContent = 
              currentContent.substring(0, selectionStart) + 
              aiResponse + 
              currentContent.substring(selectionStart + selectedText.length);
            
            setDocument({...document, content: updatedContent});
          } else {
            // 如果找不到选中文本，在末尾添加
            const updatedContent = currentContent + '\n\n' + aiResponse;
            setDocument({...document, content: updatedContent});
          }
        }
      });
    }
    
    setShowAIModal(false);
  };
  
  // ... existing code ...

  return (
    <MainLayout 
      pageTitle="智能写作" 
      breadcrumbs={[{ path: '/', title: '首页' }, { path: '/writing', title: '智能写作' }]}
    >
      {/* ... existing code ... */}
    </MainLayout>
  );
};

export default WritingPage; 