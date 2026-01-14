import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { instrumentApi } from '../services/instrumentApi';
import { InstrumentModal } from '../components/InstrumentModal';
import { InstrumentDetailModal } from '../components/InstrumentDetailModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface Instrument {
  id: number;
  name: string;
  model: string;
  serialNumber: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired' | 'damaged';
  conditionLevel: 'excellent' | 'good' | 'fair' | 'poor';
  location?: string;
  department?: string;
  responsiblePerson?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  category?: {
    id: number;
    name: string;
    code: string;
  };
  brand?: {
    id: number;
    name: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface QueryParams {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  status?: string;
  department?: string;
}

export const InstrumentPage: React.FC = () => {
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    limit: 10,
  });
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const queryClient = useQueryClient();

  // 查询仪器列表
  const { data: instrumentsData, isLoading, error } = useQuery({
    queryKey: ['instruments', queryParams],
    queryFn: () => instrumentApi.getInstruments(queryParams),
  });

  // 查询分类列表
  const { data: categories } = useQuery({
    queryKey: ['instrument-categories'],
    queryFn: () => instrumentApi.getCategories(),
  });

  // 查询品牌列表
  const { data: brands } = useQuery({
    queryKey: ['instrument-brands'],
    queryFn: () => instrumentApi.getBrands(),
  });

  // 删除仪器
  const deleteMutation = useMutation({
    mutationFn: instrumentApi.deleteInstrument,
    onSuccess: () => {
      toast.success('仪器删除成功');
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      setIsDeleteModalOpen(false);
      setSelectedInstrument(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '删除失败');
    },
  });

  // 搜索处理
  const handleSearch = () => {
    setQueryParams(prev => ({
      ...prev,
      page: 1,
      search: searchKeyword.trim() || undefined,
    }));
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchKeyword('');
    setQueryParams({
      page: 1,
      limit: 10,
    });
  };

  // 分页处理
  const handlePageChange = (page: number) => {
    setQueryParams(prev => ({ ...prev, page }));
  };

  // 状态颜色映射
  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      retired: 'bg-gray-100 text-gray-800',
      damaged: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // 状态文本映射
  const getStatusText = (status: string) => {
    const texts = {
      available: '可用',
      in_use: '使用中',
      maintenance: '维护中',
      retired: '已退役',
      damaged: '已损坏',
    };
    return texts[status as keyof typeof texts] || status;
  };

  // 设备状况颜色映射
  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // 设备状况文本映射
  const getConditionText = (condition: string) => {
    const texts = {
      excellent: '优秀',
      good: '良好',
      fair: '一般',
      poor: '较差',
    };
    return texts[condition as keyof typeof texts] || condition;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-600">请检查网络连接或稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">仪器管理</h1>
          <p className="mt-2 text-gray-600">管理实验室仪器设备的信息和状态</p>
        </div>

        {/* 搜索和筛选栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="搜索仪器名称、型号、序列号..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 筛选器 */}
            <div className="flex gap-2">
              <select
                value={queryParams.categoryId || ''}
                onChange={(e) => setQueryParams(prev => ({
                  ...prev,
                  page: 1,
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                }))}
                className="px-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有分类</option>
                {categories?.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={queryParams.status || ''}
                onChange={(e) => setQueryParams(prev => ({
                  ...prev,
                  page: 1,
                  status: e.target.value || undefined,
                }))}
                className="px-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">所有状态</option>
                <option value="available">可用</option>
                <option value="in_use">使用中</option>
                <option value="maintenance">维护中</option>
                <option value="damaged">已损坏</option>
              </select>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
              <button
                onClick={handleResetSearch}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                重置
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增仪器
              </button>
            </div>
          </div>
        </div>

        {/* 仪器列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : instrumentsData?.data?.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">暂无仪器数据</p>
            </div>
          ) : (
            <>
              {/* 表格 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        仪器信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        分类/品牌
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        位置信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        采购信息
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {instrumentsData?.data?.map((instrument: Instrument) => (
                      <tr key={instrument.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {instrument.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {instrument.model} | {instrument.serialNumber}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {instrument.category?.name || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instrument.brand?.name || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(instrument.status)}`}>
                              {getStatusText(instrument.status)}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConditionColor(instrument.conditionLevel)}`}>
                              {getConditionText(instrument.conditionLevel)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {instrument.location || '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instrument.department || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {instrument.purchasePrice ? `¥${instrument.purchasePrice.toLocaleString()}` : '-'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instrument.purchaseDate || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedInstrument(instrument);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInstrument(instrument);
                                setIsEditModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInstrument(instrument);
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 分页 */}
              {instrumentsData && instrumentsData.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    显示 {((instrumentsData.page - 1) * instrumentsData.limit) + 1} 到{' '}
                    {Math.min(instrumentsData.page * instrumentsData.limit, instrumentsData.total)} 条，
                    共 {instrumentsData.total} 条记录
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(instrumentsData.page - 1)}
                      disabled={!instrumentsData.hasPrev}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      第 {instrumentsData.page} / {instrumentsData.totalPages} 页
                    </span>
                    <button
                      onClick={() => handlePageChange(+instrumentsData.page + 1)}
                      disabled={!instrumentsData.hasNext}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 模态框 */}
      {isCreateModalOpen && (
        <InstrumentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          categories={categories || []}
          brands={brands || []}
        />
      )}

      {isEditModalOpen && selectedInstrument && (
        <InstrumentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedInstrument(null);
          }}
          instrument={selectedInstrument}
          categories={categories || []}
          brands={brands || []}
        />
      )}

      {isDetailModalOpen && selectedInstrument && (
        <InstrumentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedInstrument(null);
          }}
          instrument={selectedInstrument}
        />
      )}

      {isDeleteModalOpen && selectedInstrument && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedInstrument(null);
          }}
          onConfirm={() => deleteMutation.mutate(selectedInstrument.id)}
          title="删除仪器"
          message={`确定要删除仪器 "${selectedInstrument.name}" 吗？此操作不可恢复。`}
          confirmText="删除"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};