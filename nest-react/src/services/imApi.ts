/**
 * IM API 服务
 * 
 * 提供与后端 IM REST API 的交互接口
 */

import axios from 'axios';

const API_BASE_URL = 'https://localhost:7002/api/im';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 请求拦截器 - 添加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== 联系人相关 ====================

/**
 * 获取联系人列表
 */
export const getContacts = () => {
  return api.get('/contacts');
};

/**
 * 添加联系人
 */
export const addContact = (contactUserId: number, remark?: string) => {
  return api.post('/contacts', { contactUserId, remark });
};

/**
 * 删除联系人
 */
export const deleteContact = (id: number) => {
  return api.delete(`/contacts/${id}`);
};

// ==================== 会话相关 ====================

export interface GetConversationsParams {
  page?: number;
  limit?: number;
}

/**
 * 获取会话列表
 */
export const getConversations = (params?: GetConversationsParams) => {
  return api.get('/conversations', { params });
};

/**
 * 获取会话详情
 */
export const getConversationDetail = (id: number) => {
  return api.get(`/conversations/${id}`);
};

export interface CreateConversationData {
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  memberIds: number[];
}

/**
 * 创建会话
 */
export const createConversation = (data: CreateConversationData) => {
  return api.post('/conversations', data);
};

/**
 * 删除会话
 */
export const deleteConversation = (id: number) => {
  return api.delete(`/conversations/${id}`);
};

// ==================== 消息相关 ====================

export interface GetMessagesParams {
  conversationId: number;
  page?: number;
  limit?: number;
  beforeMessageId?: number;
}

/**
 * 获取消息列表
 */
export const getMessages = (params: GetMessagesParams) => {
  return api.get('/messages', { params });
};

export interface SendMessageData {
  conversationId: number;
  type: 'text' | 'image' | 'video';
  content?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaDuration?: number;
  replyToMessageId?: number;
}

/**
 * 发送消息
 */
export const sendMessage = (data: SendMessageData) => {
  return api.post('/messages', data);
};

/**
 * 标记消息已读
 */
export const markMessageAsRead = (conversationId: number, messageId: number) => {
  return api.post(`/messages/${messageId}/read`, { conversationId, messageId });
};

// ==================== 文件上传相关 ====================

/**
 * 上传图片
 */
export const uploadImage = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 上传视频
 */
export const uploadVideo = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post('/upload/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
