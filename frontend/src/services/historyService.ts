// 历史记录类型
export interface HistoryItem {
  id: string;
  question: string;
  time: string;
  type: string; // 全局提问|文档解读|智能写作
  status: string; // 已回答|未回答
}

// 历史记录响应
export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

// 查询参数
export interface HistoryQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
  history_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

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

// 获取历史记录列表
export const getHistoryList = async (params: HistoryQueryParams): Promise<HistoryResponse> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.history_type) queryParams.append('history_type', params.history_type);
    if (params.status) queryParams.append('status', params.status);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const response = await apiClient.get(`/history?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('获取历史记录失败:', error);
    // 如果API调用失败，返回空结果
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: 10
    };
  }
};

// 删除单个历史记录
export const deleteHistory = async (historyId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/history/${historyId}`);
    return true;
  } catch (error) {
    console.error(`删除历史记录失败: ${historyId}`, error);
    return false;
  }
};

// 批量删除历史记录
export const batchDeleteHistory = async (historyIds: string[]): Promise<{status: string; deleted_count: number}> => {
  try {
    const response = await apiClient.delete('/history', {
      data: { history_ids: historyIds } // 在DELETE请求中，数据需要放在data字段中
    });
    return response.data;
  } catch (error) {
    console.error('批量删除历史记录失败:', error);
    return { status: 'error', deleted_count: 0 };
  }
};

// 导出历史记录
export const exportHistory = async (
  format: 'json' | 'csv' = 'json', 
  params: Omit<HistoryQueryParams, 'skip' | 'limit'>
): Promise<Blob> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    if (params.history_type) queryParams.append('history_type', params.history_type);
    if (params.status) queryParams.append('status', params.status);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const response = await apiClient.get(`/history/export?${queryParams.toString()}`, {
      responseType: 'blob' // 指定响应类型为blob
    });
    
    return response.data;
  } catch (error) {
    console.error('导出历史记录失败:', error);
    throw error;
  }
};

// 获取文件名并下载导出的文件
export const downloadExportedHistory = async (
  format: 'json' | 'csv' = 'json',
  params: Omit<HistoryQueryParams, 'skip' | 'limit'>
): Promise<void> => {
  try {
    const blob = await exportHistory(format, params);
    
    // 创建默认文件名
    const fileName = `history_export_${new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 17)}.${format}`;
    
    // 创建下载链接
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    
    // 添加到页面、触发下载并清理
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('下载历史记录失败:', error);
    throw error;
  }
}; 