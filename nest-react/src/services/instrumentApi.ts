import axios from 'axios';

const API_BASE_URL = 'https://192.168.1.199:7002';

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证 token
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
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface InstrumentQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  status?: string;
  department?: string;
  location?: string;
  conditionLevel?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateInstrumentData {
  name: string;
  model: string;
  serialNumber: string;
  categoryId: number;
  brandId: number;
  specifications?: Record<string, any>;
  description?: string;
  imageUrls?: string[];
  manualUrl?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  supplier?: string;
  warrantyPeriod?: number;
  warrantyExpireDate?: string;
  location?: string;
  department?: string;
  responsiblePerson?: string;
  contactInfo?: string;
  status?: 'available' | 'in_use' | 'maintenance' | 'retired' | 'damaged';
  conditionLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface UpdateInstrumentData extends Partial<CreateInstrumentData> {}

export const instrumentApi = {
  // 获取仪器列表
  async getInstruments(params: InstrumentQueryParams = {}) {
    const response = await api.get('/instruments', { params });
    return response.data;
  },

  // 获取仪器详情
  async getInstrument(id: number) {
    const response = await api.get(`/instruments/${id}`);
    return response.data;
  },

  // 创建仪器
  async createInstrument(data: CreateInstrumentData) {
    const response = await api.post('/instruments', data);
    return response.data;
  },

  // 更新仪器
  async updateInstrument(id: number, data: UpdateInstrumentData) {
    const response = await api.patch(`/instruments/${id}`, data);
    return response.data;
  },

  // 删除仪器
  async deleteInstrument(id: number) {
    const response = await api.delete(`/instruments/${id}`);
    return response.data;
  },

  // 批量删除仪器
  async batchDeleteInstruments(ids: number[]) {
    const response = await api.delete('/instruments/batch', { data: { ids } });
    return response.data;
  },

  // 搜索仪器
  async searchInstruments(keyword: string, limit?: number) {
    const response = await api.get('/instruments/search', {
      params: { keyword, limit },
    });
    return response.data;
  },

  // 获取仪器统计信息
  async getInstrumentStats() {
    const response = await api.get('/instruments/stats');
    return response.data;
  },

  // 获取仪器分类
  async getCategories() {
    const response = await api.get('/instrument-categories');
    return response.data;
  },

  // 获取仪器品牌
  async getBrands() {
    const response = await api.get('/instrument-brands');
    return response.data;
  },

  // 创建分类
  async createCategory(data: {
    name: string;
    code: string;
    description?: string;
    parentId?: number;
    sortOrder?: number;
  }) {
    const response = await api.post('/instrument-categories', data);
    return response.data;
  },

  // 创建品牌
  async createBrand(data: {
    name: string;
    code: string;
    logoUrl?: string;
    website?: string;
    country?: string;
    description?: string;
  }) {
    const response = await api.post('/instrument-brands', data);
    return response.data;
  },
};