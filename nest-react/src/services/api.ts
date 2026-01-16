import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest, ProfileResponse, LogoutResponse } from '../types/auth';
const CryptoJS = require('crypto-js');

// 创建 axios 实例
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:7002',
  timeout: 10000,
});

// 在浏览器环境中，我们不能直接设置 httpsAgent
// 浏览器会自动处理 HTTPS 连接

// MD5 加密函数
const md5 = (str: string): string => {
  return CryptoJS.MD5(str).toString();
};

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证 API
export const authAPI = {
  // 用户注册
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', {
      ...data,
      password: md5(data.password) // MD5 加密密码
    });
    return response.data;
  },

  // 用户登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', {
      ...data,
      password: md5(data.password) // MD5 加密密码
    });
    return response.data;
  },

  // 获取用户信息
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // 退出登录
  logout: async (): Promise<LogoutResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

export default api;