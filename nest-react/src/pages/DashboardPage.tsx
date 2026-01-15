import React from 'react';
import { User, LogOut, Shield, Clock, Mail, Settings, Package, MessageCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, profile, logout, isLoading, profileLoading } = useAuth();

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                用户仪表板
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                欢迎，{displayUser?.username}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                退出登录
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 用户信息卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        用户名
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {displayUser?.username}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 邮箱信息卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        邮箱地址
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {displayUser?.email}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* 注册时间卡片 */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        注册时间
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {displayUser?.created_at 
                          ? new Date(displayUser.created_at).toLocaleDateString('zh-CN')
                          : '未知'
                        }
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 功能区域 */}
          <div className="mt-8">
            {/* 快捷功能 */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  快捷功能
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    to="/instruments"
                    className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="w-6 h-6 text-blue-600 group-hover:text-blue-700" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800 group-hover:text-blue-900">
                          仪器管理
                        </p>
                        <p className="text-sm text-blue-600 group-hover:text-blue-700">
                          管理实验室仪器设备
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/chat"
                    className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <MessageCircle className="w-6 h-6 text-green-600 group-hover:text-green-700" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800 group-hover:text-green-900">
                          即时通讯
                        </p>
                        <p className="text-sm text-green-600 group-hover:text-green-700">
                          实时聊天和消息
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link
                    to="/ai-chat"
                    className="bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 p-4 rounded-lg transition-colors group border border-purple-200"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-purple-600 group-hover:text-purple-700" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-800 group-hover:text-purple-900 flex items-center">
                          AI 助手
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-200 text-purple-800 rounded-full">新</span>
                        </p>
                        <p className="text-sm text-purple-600 group-hover:text-purple-700">
                          智能对话和问答
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  <div className="bg-gray-50 p-4 rounded-lg opacity-50">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Settings className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">
                          系统设置
                        </p>
                        <p className="text-sm text-gray-500">
                          即将推出
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 系统信息 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  系统信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          认证状态：已登录
                        </p>
                        <p className="text-sm text-green-600">
                          Token 有效期：30天
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-800">
                          安全连接：HTTPS + HTTP/2
                        </p>
                        <p className="text-sm text-blue-600">
                          数据传输已加密
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};