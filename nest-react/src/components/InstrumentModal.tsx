import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { instrumentApi, CreateInstrumentData, UpdateInstrumentData } from '../services/instrumentApi';

interface InstrumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument?: any;
  categories: any[];
  brands: any[];
}

export const InstrumentModal: React.FC<InstrumentModalProps> = ({
  isOpen,
  onClose,
  instrument,
  categories,
  brands,
}) => {
  const [formData, setFormData] = useState<CreateInstrumentData>({
    name: '',
    model: '',
    serialNumber: '',
    categoryId: 0,
    brandId: 0,
    description: '',
    location: '',
    department: '',
    responsiblePerson: '',
    contactInfo: '',
    purchaseDate: '',
    purchasePrice: undefined,
    supplier: '',
    warrantyPeriod: undefined,
    status: 'available',
    conditionLevel: 'excellent',
  });

  const queryClient = useQueryClient();
  const isEdit = !!instrument;

  // 创建仪器
  const createMutation = useMutation({
    mutationFn: instrumentApi.createInstrument,
    onSuccess: () => {
      toast.success('仪器创建成功');
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '创建失败');
    },
  });

  // 更新仪器
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInstrumentData }) =>
      instrumentApi.updateInstrument(id, data),
    onSuccess: () => {
      toast.success('仪器更新成功');
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '更新失败');
    },
  });

  // 初始化表单数据
  useEffect(() => {
    if (instrument) {
      setFormData({
        name: instrument.name || '',
        model: instrument.model || '',
        serialNumber: instrument.serialNumber || '',
        categoryId: Number(instrument.categoryId) || Number(instrument.category?.id) || 0,
        brandId: Number(instrument.brandId) || Number(instrument.brand?.id) || 0,
        description: instrument.description || '',
        location: instrument.location || '',
        department: instrument.department || '',
        responsiblePerson: instrument.responsiblePerson || '',
        contactInfo: instrument.contactInfo || '',
        purchaseDate: instrument.purchaseDate || '',
        purchasePrice: instrument.purchasePrice || undefined,
        supplier: instrument.supplier || '',
        warrantyPeriod: instrument.warrantyPeriod || undefined,
        status: instrument.status || 'available',
        conditionLevel: instrument.conditionLevel || 'excellent',
      });
    } else {
      setFormData({
        name: '',
        model: '',
        serialNumber: '',
        categoryId: 0,
        brandId: 0,
        description: '',
        location: '',
        department: '',
        responsiblePerson: '',
        contactInfo: '',
        purchaseDate: '',
        purchasePrice: undefined,
        supplier: '',
        warrantyPeriod: undefined,
        status: 'available',
        conditionLevel: 'excellent',
      });
    }
  }, [instrument]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 基本验证
    if (!formData.name.trim()) {
      toast.error('请输入仪器名称');
      return;
    }
    if (!formData.model.trim()) {
      toast.error('请输入仪器型号');
      return;
    }
    if (!formData.serialNumber.trim()) {
      toast.error('请输入序列号');
      return;
    }
    if (!formData.categoryId || formData.categoryId === 0) {
      toast.error('请选择仪器分类');
      return;
    }
    if (!formData.brandId || formData.brandId === 0) {
      toast.error('请选择仪器品牌');
      return;
    }

    // 确保数字字段是正确的类型
    const submitData = {
      ...formData,
      categoryId: Number(formData.categoryId),
      brandId: Number(formData.brandId),
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : undefined,
      warrantyPeriod: formData.warrantyPeriod ? Number(formData.warrantyPeriod) : undefined,
    };

    console.log('提交数据:', submitData); // 调试日志

    if (isEdit) {
      updateMutation.mutate({ id: instrument.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // 特殊处理需要转换为数字的字段
    if (name === 'categoryId' || name === 'brandId' || name === 'purchasePrice' || name === 'warrantyPeriod') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? Number(value) : (name === 'categoryId' || name === 'brandId' ? 0 : undefined),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value ? Number(value) : undefined) : value,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? '编辑仪器' : '新增仪器'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 基本信息 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仪器名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入仪器名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                型号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入仪器型号"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                序列号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入序列号/资产编号"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仪器分类 <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">请选择分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仪器品牌 <span className="text-red-500">*</span>
              </label>
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">请选择品牌</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                仪器状态
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="available">可用</option>
                <option value="in_use">使用中</option>
                <option value="maintenance">维护中</option>
                <option value="damaged">已损坏</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                设备状况
              </label>
              <select
                name="conditionLevel"
                value={formData.conditionLevel}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="excellent">优秀</option>
                <option value="good">良好</option>
                <option value="fair">一般</option>
                <option value="poor">较差</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入仪器描述"
              />
            </div>

            {/* 位置信息 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">位置信息</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                存放位置
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入存放位置"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属部门
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入所属部门"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                负责人
              </label>
              <input
                type="text"
                name="responsiblePerson"
                value={formData.responsiblePerson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入负责人"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系方式
              </label>
              <input
                type="text"
                name="contactInfo"
                value={formData.contactInfo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入联系方式"
              />
            </div>

            {/* 采购信息 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">采购信息</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                采购日期
              </label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                采购价格 (元)
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={formData.purchasePrice || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入采购价格"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                供应商
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入供应商"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保修期 (月)
              </label>
              <input
                type="number"
                name="warrantyPeriod"
                value={formData.warrantyPeriod || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入保修期"
                min="0"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isEdit ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};