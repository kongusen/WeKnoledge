import axios, { 
  AxiosResponse, 
  AxiosError, 
  InternalAxiosRequestConfig
} from 'axios';
import { message } from 'antd';
import { getToken, handleAuthError } from '@/services/authService';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { detail?: string } || {};
      const errorMsg = data.detail || '请求出错';

      switch (status) {
        case 401: // 未授权
          message.error('登录已过期，请重新登录');
          handleAuthError();
          break;
        case 403: // 禁止访问
          message.error('没有访问权限');
          handleAuthError();
          break;
        case 400: // 错误请求
          message.error(errorMsg || '请求参数错误');
          break;
        case 404: // 未找到
          message.error(errorMsg || '请求的资源不存在');
          break;
        case 500: // 服务器错误
          message.error(errorMsg || '服务器内部错误');
          break;
        default:
          message.error(errorMsg || `请求出错 (${status})`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message.error('无法连接到服务器，请检查网络');
    } else {
      // 请求配置出错
      message.error(`请求错误: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// 通用请求方法
const get = <T>(url: string, params?: any): Promise<T> => {
  return api.get(url, { params }).then(response => response.data);
};

const post = <T>(url: string, data?: any): Promise<T> => {
  return api.post(url, data).then(response => response.data);
};

const put = <T>(url: string, data?: any): Promise<T> => {
  return api.put(url, data).then(response => response.data);
};

const del = <T>(url: string): Promise<T> => {
  return api.delete(url).then(response => response.data);
};

export { get, post, put, del };
export default api; 