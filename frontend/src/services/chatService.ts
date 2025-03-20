// 消息类型定义
export interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  references?: DocumentReference[];
}

// 文档引用类型定义
export interface DocumentReference {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  excerpt: string;
}

// 聊天历史类型定义
export interface ChatHistory {
  id: string;
  title: string;
  updatedAt: Date;
  messages: Message[];
}

// 创建聊天历史请求
export interface CreateChatHistoryRequest {
  title?: string;
}

// 更新聊天历史请求
export interface UpdateChatHistoryRequest {
  title?: string;
  messages?: Message[];
}

// 本地存储相关函数

// 保存聊天历史到本地存储
export const saveChatHistoriesToLocal = (histories: ChatHistory[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('chatHistories', JSON.stringify(histories));
};

// 从本地存储获取聊天历史
export const getChatHistoriesFromLocal = (): ChatHistory[] => {
  if (typeof window === 'undefined') return [];
  
  const storedHistories = localStorage.getItem('chatHistories');
  if (storedHistories) {
    try {
      return JSON.parse(storedHistories);
    } catch (error) {
      console.error('解析存储的聊天历史失败:', error);
      return [];
    }
  }
  return [];
};

// 保存特定聊天历史到本地存储
export const saveChatHistoryToLocal = (chatHistory: ChatHistory): void => {
  const histories = getChatHistoriesFromLocal();
  const existingIndex = histories.findIndex(h => h.id === chatHistory.id);
  
  if (existingIndex >= 0) {
    histories[existingIndex] = chatHistory;
  } else {
    histories.unshift(chatHistory);
  }
  
  saveChatHistoriesToLocal(histories);
};

// 从本地存储删除聊天历史
export const deleteChatHistoryFromLocal = (chatId: string): void => {
  const histories = getChatHistoriesFromLocal();
  const updatedHistories = histories.filter(h => h.id !== chatId);
  saveChatHistoriesToLocal(updatedHistories);
};

// API函数 - 连接到后端API

import axios from 'axios';
import { getToken } from './authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 创建HTTP请求实例
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器来设置认证头
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 发送聊天消息
export const sendChatMessage = async (content: string, historyId?: string) => {
  try {
    const response = await apiClient.post('/qa/ask', {
      query: content,
      history_id: historyId,
      use_history: !!historyId,
      max_results: 5,
      similarity_threshold: 0.7
    });
    
    return {
      id: Date.now().toString(),
      content: response.data.answer,
      type: 'assistant' as const,
      timestamp: new Date(),
      references: response.data.citations.map(cite => ({
        documentId: cite.document_id,
        documentName: cite.document_title,
        excerpt: cite.content
      }))
    };
  } catch (error) {
    console.error('发送消息失败:', error);
    throw error;
  }
};

// 获取聊天历史列表
export const getChatHistories = async () => {
  try {
    const response = await apiClient.get('/chat');
    return response.data.map(history => ({
      id: history.id,
      title: history.title || '新对话',
      updatedAt: new Date(history.updated_at),
      messages: history.messages.map(msg => ({
        id: Date.now().toString() + Math.random(),
        content: msg.content,
        type: msg.role,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch (error) {
    console.error('获取聊天历史失败:', error);
    // 如果API调用失败，回退到本地存储
    return getChatHistoriesFromLocal();
  }
};

// 获取特定聊天历史
export const getChatHistory = async (chatId: string) => {
  try {
    const response = await apiClient.get(`/chat/${chatId}`);
    return {
      id: response.data.id,
      title: response.data.title || '新对话',
      updatedAt: new Date(response.data.updated_at),
      messages: response.data.messages.map(msg => ({
        id: Date.now().toString() + Math.random(),
        content: msg.content,
        type: msg.role,
        timestamp: new Date(msg.timestamp)
      }))
    };
  } catch (error) {
    console.error(`获取聊天历史 ${chatId} 失败:`, error);
    // 如果API调用失败，回退到本地存储
    const histories = getChatHistoriesFromLocal();
    return histories.find(h => h.id === chatId);
  }
};

// 创建新的聊天历史
export const createChatHistory = async (data: CreateChatHistoryRequest) => {
  try {
    const response = await apiClient.post('/chat', data);
    return {
      id: response.data.id,
      title: response.data.title || '新对话',
      updatedAt: new Date(response.data.updated_at),
      messages: []
    };
  } catch (error) {
    console.error('创建聊天历史失败:', error);
    // 如果API调用失败，创建本地记录
    const newHistory = {
      id: Date.now().toString(),
      title: data.title || '新对话',
      updatedAt: new Date(),
      messages: []
    };
    saveChatHistoryToLocal(newHistory);
    return newHistory;
  }
};

// 更新聊天历史
export const updateChatHistory = async (chatId: string, data: UpdateChatHistoryRequest) => {
  try {
    const response = await apiClient.put(`/chat/${chatId}`, data);
    return {
      id: response.data.id,
      title: response.data.title || '新对话',
      updatedAt: new Date(response.data.updated_at),
      messages: response.data.messages.map(msg => ({
        id: Date.now().toString() + Math.random(),
        content: msg.content,
        type: msg.role,
        timestamp: new Date(msg.timestamp)
      }))
    };
  } catch (error) {
    console.error(`更新聊天历史 ${chatId} 失败:`, error);
    throw error;
  }
};

// 删除聊天历史
export const deleteChatHistory = async (chatId: string) => {
  try {
    await apiClient.delete(`/chat/${chatId}`);
    // 同时删除本地存储中的记录
    deleteChatHistoryFromLocal(chatId);
    return true;
  } catch (error) {
    console.error(`删除聊天历史 ${chatId} 失败:`, error);
    throw error;
  }
}; 