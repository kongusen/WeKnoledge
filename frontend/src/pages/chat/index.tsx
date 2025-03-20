import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, List, Avatar, Typography, Spin, Divider, Empty, message } from 'antd';
import { useRouter } from 'next/router';
import { SendOutlined, RobotOutlined, UserOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { getLocalSystemConfig } from '@/services/configService';
import { getChatHistoriesFromLocal, saveChatHistoryToLocal, deleteChatHistoryFromLocal } from '@/services/chatService';

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [systemConfig, setSystemConfig] = useState(getLocalSystemConfig());
  const router = useRouter();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化欢迎消息
  useEffect(() => {
    // 如果没有消息，添加欢迎消息
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        content: `欢迎使用${systemConfig.systemName}的全局问答功能。您可以向我提问任何问题，我会尽力回答。`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, []);
  
  // 处理从首页传递的查询参数
  useEffect(() => {
    const { q } = router.query;
    if (typeof q === 'string' && q.trim() && messages.length <= 1) {
      // 只有一条欢迎消息时，将查询作为用户的第一个问题
      setInputValue(q);
      // 使用setTimeout确保欢迎消息已加载
      setTimeout(() => {
        handleSendMessage(q);
      }, 500);
    }

    // 从sessionStorage获取查询
    const searchQuery = sessionStorage.getItem('searchQuery');
    if (searchQuery && messages.length <= 1 && !q) {
      setInputValue(searchQuery);
      // 清除sessionStorage中的查询
      sessionStorage.removeItem('searchQuery');
      // 发送消息
      setTimeout(() => {
        handleSendMessage(searchQuery);
      }, 500);
    }
  }, [router.query, messages]);
  
  // 添加消息后滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 加载聊天历史
  useEffect(() => {
    // 从本地存储加载聊天历史
    const histories = getChatHistoriesFromLocal();
    setChatHistories(histories);
  }, []);
  
  // 发送消息
  const handleSendMessage = async (content?: string) => {
    const messageContent = content || inputValue;
    if (!messageContent.trim()) return;
    
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟回复
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `这是对"${messageContent}"的回复。在实际实现中，这将来自后端API。`,
        type: 'assistant',
        timestamp: new Date()
      };
      
      // 添加助手回复到列表
      setMessages(prev => [...prev, assistantMessage]);
      
      // 保存或更新当前对话
      saveCurrentChat();
    } catch (error) {
      console.error('无法获取回复:', error);
      message.error('获取回复失败，请重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 开始新对话
  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    
    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `欢迎使用${systemConfig.systemName}的全局问答功能。您可以向我提问任何问题，我会尽力回答。`,
      type: 'assistant',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  };
  
  // 加载选定的聊天历史
  const loadChatHistory = (chatId: string) => {
    const selectedChat = chatHistories.find(history => history.id === chatId);
    if (selectedChat) {
      setMessages(selectedChat.messages);
      setCurrentChatId(chatId);
    }
  };
  
  // 保存当前对话
  const saveCurrentChat = () => {
    // 如果只有欢迎消息，不保存
    if (messages.length <= 1) return;
    
    // 创建或更新聊天历史
    const chatId = currentChatId || Date.now().toString();
    
    // 创建聊天标题（使用第一条用户消息的前20个字符）
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    const chatTitle = firstUserMessage 
      ? firstUserMessage.content.substring(0, 20) + (firstUserMessage.content.length > 20 ? '...' : '') 
      : `新对话 ${new Date().toLocaleString()}`;
    
    const updatedChat: ChatHistory = {
      id: chatId,
      title: chatTitle,
      updatedAt: new Date(),
      messages: [...messages]
    };
    
    // 保存到本地存储
    saveChatHistoryToLocal(updatedChat);
    
    // 更新聊天历史列表和当前聊天ID
    setChatHistories(prev => {
      const newHistories = prev.filter(history => history.id !== chatId);
      return [updatedChat, ...newHistories];
    });
    setCurrentChatId(chatId);
  };
  
  // 删除聊天历史
  const deleteChatHistory = (chatId: string) => {
    // 从本地存储删除
    deleteChatHistoryFromLocal(chatId);
    
    // 更新聊天历史列表
    setChatHistories(prev => prev.filter(history => history.id !== chatId));
    
    // 如果删除的是当前对话，开始新对话
    if (currentChatId === chatId) {
      startNewChat();
    }
  };
  
  return (
    <MainLayout 
      pageTitle="全局问答" 
      breadcrumbs={[{ path: '/', title: '首页' }, { path: '/chat', title: '全局问答' }]}
    >
      {/* ... existing code ... */}
    </MainLayout>
  );
};

export default ChatPage; 