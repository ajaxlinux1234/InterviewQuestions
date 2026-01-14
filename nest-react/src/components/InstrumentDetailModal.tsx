import React from 'react';
import { X, Calendar, MapPin, DollarSign, Package, Settings } from 'lucide-react';

interface InstrumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrument: any;
}

export const InstrumentDetailModal: React.FC<InstrumentDetailModalProps> = ({
  isOpen,
  onClose,
  instrument,
}) => {
  if (!isOpen || !instrument) return null;

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const formatPrice = (price: number) => {
    if (!price) return '-';
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{instrument.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {instrument.model} | {instrument.serialNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 状态标签 */}
          <div className="flex gap-2 mb-6">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(instrument.status)}`}>
              {getStatusText(instrument.status)}
            </span>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getConditionColor(instrument.conditionLevel)}`}>
              {getConditionText(instrument.conditionLevel)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                基本信息
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">仪器名称</label>
                  <p className="text-sm text-gray-900">{instrument.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">型号</label>
                  <p className="text-sm text-gray-900">{instrument.model}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">序列号</label>
                  <p className="text-sm text-gray-900">{instrument.serialNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">分类</label>
                  <p className="text-sm text-gray-900">{instrument.category?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">品牌</label>
                  <p className="text-sm text-gray-900">{instrument.brand?.name || '-'}</p>
                </div>
                {instrument.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">描述</label>
                    <p className="text-sm text-gray-900">{instrument.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 位置信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                位置信息
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">存放位置</label>
                  <p className="text-sm text-gray-900">{instrument.location || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">所属部门</label>
                  <p className="text-sm text-gray-900">{instrument.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">负责人</label>
                  <p className="text-sm text-gray-900">{instrument.responsiblePerson || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">联系方式</label>
                  <p className="text-sm text-gray-900">{instrument.contactInfo || '-'}</p>
                </div>
              </div>
            </div>

            {/* 采购信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                采购信息
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">采购日期</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.purchaseDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">采购价格</label>
                  <p className="text-sm text-gray-900">{formatPrice(instrument.purchasePrice)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">供应商</label>
                  <p className="text-sm text-gray-900">{instrument.supplier || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">保修期</label>
                  <p className="text-sm text-gray-900">
                    {instrument.warrantyPeriod ? `${instrument.warrantyPeriod} 个月` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">保修到期日期</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.warrantyExpireDate)}</p>
                </div>
              </div>
            </div>

            {/* 维护信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                维护信息
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500">最后维护日期</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.lastMaintenanceDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">下次维护日期</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.nextMaintenanceDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">累计使用时长</label>
                  <p className="text-sm text-gray-900">
                    {instrument.usageHours ? `${instrument.usageHours} 小时` : '0 小时'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">使用次数</label>
                  <p className="text-sm text-gray-900">{instrument.usageCount || 0} 次</p>
                </div>
              </div>
            </div>

            {/* 技术规格 */}
            {instrument.specifications && Object.keys(instrument.specifications).length > 0 && (
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  技术规格
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(instrument.specifications).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-500">{key}</label>
                        <p className="text-sm text-gray-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 系统信息 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                系统信息
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">创建时间</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">更新时间</label>
                  <p className="text-sm text-gray-900">{formatDate(instrument.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};