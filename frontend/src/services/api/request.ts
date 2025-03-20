import axios from 'axios';
import { message } from 'antd';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const request = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response) {
      // 根据状态码处理错误
      switch (response.status) {
        case 401:
          message.error('登录状态已过期，请重新登录');
          // 清除用户信息并跳转到登录页
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error('没有操作权限');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器错误，请联系管理员');
          break;
        default:
          message.error(response.data?.message || '操作失败');
      }
    } else {
      // 网络错误
      message.error('网络连接异常，请稍后再试');
    }
    return Promise.reject(error);
  }
);

export default request; 