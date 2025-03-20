// 文档类型
export interface WritingDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  type: 'article' | 'report' | 'email' | 'other';
  userId?: string;
}

// 写作风格
export type WritingStyle = 'academic' | 'business' | 'creative' | 'technical' | 'conversational';

// 写作长度
export type WritingLength = 'short' | 'medium' | 'long';

// AI辅助提示类型
export type PromptType = 'continue' | 'improve' | 'summarize' | 'translate' | 'custom';

// AI辅助请求参数
export interface AIAssistRequest {
  prompt_type: PromptType;
  content: string;
  selected_text?: string;
  custom_prompt?: string;
  writing_style: WritingStyle;
  writing_length: WritingLength;
}

// 后端文档接口
interface BackendWritingDocument {
  id: string;
  title: string;
  content: string;
  type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// 本地存储相关函数

// 保存文档到本地存储
export const saveWritingDocumentsToLocal = (documents: WritingDocument[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('writingDocuments', JSON.stringify(documents));
};

// 从本地存储获取文档
export const getWritingDocumentsFromLocal = (): WritingDocument[] => {
  if (typeof window === 'undefined') return [];
  
  const storedDocuments = localStorage.getItem('writingDocuments');
  if (storedDocuments) {
    try {
      return JSON.parse(storedDocuments);
    } catch (error) {
      console.error('解析存储的文档失败:', error);
      return [];
    }
  }
  return [];
};

// 保存单个文档到本地存储
export const saveWritingDocumentToLocal = (document: WritingDocument): WritingDocument[] => {
  const documents = getWritingDocumentsFromLocal();
  const existingIndex = documents.findIndex(doc => doc.id === document.id);
  
  if (existingIndex >= 0) {
    documents[existingIndex] = document;
  } else {
    documents.unshift(document);
  }
  
  saveWritingDocumentsToLocal(documents);
  return documents;
};

// 从本地存储删除文档
export const deleteWritingDocumentFromLocal = (documentId: string): WritingDocument[] => {
  const documents = getWritingDocumentsFromLocal();
  const updatedDocuments = documents.filter(doc => doc.id !== documentId);
  saveWritingDocumentsToLocal(updatedDocuments);
  return updatedDocuments;
};

// 将后端文档格式转换为前端格式
const convertToFrontendWritingDocument = (doc: BackendWritingDocument): WritingDocument => {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    type: doc.type as 'article' | 'report' | 'email' | 'other',
    createdAt: new Date(doc.created_at),
    updatedAt: new Date(doc.updated_at),
    userId: doc.user_id
  };
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

// 获取用户文档列表
export const getUserWritingDocuments = async () => {
  try {
    const response = await apiClient.get<BackendWritingDocument[]>('/writing/documents');
    return { 
      data: response.data.map(convertToFrontendWritingDocument)
    };
  } catch (error) {
    console.error('获取文档列表失败:', error);
    // 如果API调用失败，回退到本地存储
    return { data: getWritingDocumentsFromLocal() };
  }
};

// 创建新文档
export const createWritingDocument = async (document: Partial<WritingDocument>) => {
  try {
    const response = await apiClient.post<BackendWritingDocument>('/writing/documents', {
      title: document.title || '无标题文档',
      content: document.content || '',
      type: document.type || 'article'
    });
    
    const newDoc = convertToFrontendWritingDocument(response.data);
    
    // 也保存到本地存储，便于断网情况下使用
    saveWritingDocumentToLocal(newDoc);
    
    return newDoc;
  } catch (error) {
    console.error('创建文档失败:', error);
    
    // 如果API调用失败，创建本地记录
    const newDoc: WritingDocument = {
      id: Date.now().toString(),
      title: document.title || '无标题文档',
      content: document.content || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      type: document.type || 'article'
    };
    
    saveWritingDocumentToLocal(newDoc);
    return newDoc;
  }
};

// 更新文档
export const updateWritingDocument = async (documentId: string, document: Partial<WritingDocument>) => {
  try {
    const response = await apiClient.put<BackendWritingDocument>(`/writing/documents/${documentId}`, {
      title: document.title,
      content: document.content,
      type: document.type
    });
    
    const updatedDoc = convertToFrontendWritingDocument(response.data);
    
    // 更新本地存储
    saveWritingDocumentToLocal(updatedDoc);
    
    return updatedDoc;
  } catch (error) {
    console.error('更新文档失败:', error);
    throw error;
  }
};

// 获取文档详情
export const getWritingDocument = async (documentId: string) => {
  try {
    const response = await apiClient.get<BackendWritingDocument>(`/writing/documents/${documentId}`);
    return convertToFrontendWritingDocument(response.data);
  } catch (error) {
    console.error(`获取文档详情失败: ${documentId}`, error);
    
    // 如果API调用失败，从本地存储获取
    const documents = getWritingDocumentsFromLocal();
    const doc = documents.find(d => d.id === documentId);
    if (!doc) {
      throw new Error('文档不存在');
    }
    return doc;
  }
};

// 删除文档
export const deleteWritingDocument = async (documentId: string) => {
  try {
    await apiClient.delete(`/writing/documents/${documentId}`);
    // 同时从本地存储中删除
    deleteWritingDocumentFromLocal(documentId);
    return true;
  } catch (error) {
    console.error(`删除文档失败: ${documentId}`, error);
    throw error;
  }
};

// 使用AI辅助写作
export const useAIAssist = async (params: AIAssistRequest) => {
  try {
    const response = await apiClient.post('/writing/ai-assist', params);
    return response.data.result;
  } catch (error) {
    console.error('AI辅助写作失败:', error);
    
    // 如果API调用失败，返回模拟响应
    const mockResult = params.prompt_type === 'improve'
      ? `这是优化后的${params.writing_style}风格文本：\n\n${params.selected_text}（优化后的内容）`
      : params.prompt_type === 'continue'
      ? `这是AI继续写作的内容...\n\n在实际实现中，这里会是AI生成的后续内容。`
      : params.prompt_type === 'summarize'
      ? `这是对所选内容的总结...\n\n在实际实现中，这里会是AI生成的总结。`
      : params.prompt_type === 'translate'
      ? `This is the translated content...\n\nIn actual implementation, this would be the AI-generated translation.`
      : `这是自定义提示的回复...\n\n在实际实现中，这里会是基于您自定义提示的AI生成内容。`;
    
    return mockResult;
  }
}; 