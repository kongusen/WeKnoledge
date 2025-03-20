// 文档类型定义
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadTime: Date;
  status: 'processing' | 'ready' | 'error';
  userId?: string;
}

// 文档创建参数
export interface CreateDocumentParams {
  title: string;
  content?: string;
  doc_type?: string;
  tags?: string[];
  knowledge_base_id: string;
}

// 后端文档接口
interface BackendDocument {
  id: string;
  title: string;
  doc_type?: string;
  content?: string;
  tags?: string[];
  metadata?: {
    size?: number;
    [key: string]: any;
  };
  created_at: string;
  has_embedding: boolean;
}

// 本地存储相关函数

// 保存文档到本地存储
export const saveDocumentsToLocal = (documents: Document[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userDocuments', JSON.stringify(documents));
};

// 从本地存储获取文档
export const getDocumentsFromLocal = (): Document[] => {
  if (typeof window === 'undefined') return [];
  
  const storedDocuments = localStorage.getItem('userDocuments');
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

// 从本地存储删除文档
export const deleteDocumentFromLocal = (documentId: string): Document[] => {
  const documents = getDocumentsFromLocal();
  const updatedDocuments = documents.filter(doc => doc.id !== documentId);
  saveDocumentsToLocal(updatedDocuments);
  return updatedDocuments;
};

// 更新文档状态
export const updateDocumentStatus = (documentId: string, status: 'processing' | 'ready' | 'error'): Document[] => {
  const documents = getDocumentsFromLocal();
  const updatedDocuments = documents.map(doc => 
    doc.id === documentId ? { ...doc, status } : doc
  );
  saveDocumentsToLocal(updatedDocuments);
  return updatedDocuments;
};

// 将后端文档格式转换为前端格式
const convertToFrontendDocument = (doc: BackendDocument): Document => {
  return {
    id: doc.id,
    name: doc.title,
    type: doc.doc_type || 'unknown',
    size: doc.metadata?.size || 0,
    uploadTime: new Date(doc.created_at),
    status: doc.has_embedding ? 'ready' : 'processing' as 'processing' | 'ready'
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
export const getUserDocuments = async (knowledgeBaseId?: string) => {
  try {
    // 构建查询参数
    let url = '/document';
    if (knowledgeBaseId) {
      url += `?knowledge_base_id=${knowledgeBaseId}`;
    }
    
    const response = await apiClient.get<BackendDocument[]>(url);
    return { 
      data: response.data.map(convertToFrontendDocument)
    };
  } catch (error) {
    console.error('获取文档列表失败:', error);
    // 如果API调用失败，回退到本地存储
    return { data: getDocumentsFromLocal() };
  }
};

// 创建文档
export const createDocument = async (params: CreateDocumentParams) => {
  try {
    const response = await apiClient.post<BackendDocument>('/document', params);
    return convertToFrontendDocument(response.data);
  } catch (error) {
    console.error('创建文档失败:', error);
    throw error;
  }
};

// 上传文档
export const uploadDocument = async (file: File, knowledgeBaseId: string, tags: string = '') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('knowledge_base_id', knowledgeBaseId);
    formData.append('tags', tags);
    
    const response = await apiClient.post<BackendDocument>('/document/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const newDoc: Document = {
      id: response.data.id,
      name: response.data.title,
      type: file.type,
      size: file.size,
      uploadTime: new Date(response.data.created_at),
      status: response.data.has_embedding ? 'ready' : 'processing'
    };
    
    // 也保存到本地存储，便于断网情况下使用
    const docs = getDocumentsFromLocal();
    docs.push(newDoc);
    saveDocumentsToLocal(docs);
    
    return newDoc;
  } catch (error) {
    console.error('上传文档失败:', error);
    throw error;
  }
};

// 获取文档详情
export const getDocumentDetails = async (documentId: string) => {
  try {
    const response = await apiClient.get<BackendDocument>(`/document/${documentId}`);
    return {
      id: response.data.id,
      name: response.data.title,
      type: response.data.doc_type || 'unknown',
      content: response.data.content,
      tags: response.data.tags || [],
      size: response.data.metadata?.size || 0,
      uploadTime: new Date(response.data.created_at),
      status: response.data.has_embedding ? 'ready' : 'processing' as 'processing' | 'ready'
    };
  } catch (error) {
    console.error(`获取文档详情失败: ${documentId}`, error);
    throw error;
  }
};

// 删除文档
export const deleteDocument = async (documentId: string) => {
  try {
    await apiClient.delete(`/document/${documentId}`);
    // 同时从本地存储中删除
    deleteDocumentFromLocal(documentId);
    return true;
  } catch (error) {
    console.error(`删除文档失败: ${documentId}`, error);
    throw error;
  }
};

// 获取文档预览URL
export const getDocumentPreviewUrl = (documentId: string) => {
  return `${API_URL}/api/v1/document/${documentId}/preview`;
}; 