/**
 * 添加联系人模态框
 */

import { useState } from 'react';
import { searchUsers, addContact, createConversation } from '../services/imApi';

interface AddContactModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddContactModal({ onClose, onSuccess }: AddContactModalProps) {
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // 搜索用户
  const handleSearch = async () => {
    if (!keyword.trim()) {
      return;
    }

    setLoading(true);
    try {
      const results = await searchUsers(keyword);
      setSearchResults(results as any);
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 添加联系人
  const handleAddContact = async (userId: number) => {
    setAdding(true);
    try {
      await addContact(userId);
      alert('添加成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('添加失败:', error);
      alert(error.response?.data?.message || '添加失败，请重试');
    } finally {
      setAdding(false);
    }
  };

  // 发起聊天
  const handleStartChat = async (userId: number) => {
    try {
      await createConversation({
        type: 'private',
        memberIds: [userId],
      });
      onSuccess();
      onClose();
      // 可以在这里跳转到新创建的会话
    } catch (error) {
      console.error('创建会话失败:', error);
      alert('创建会话失败，请重试');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">添加联系人</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入用户名或邮箱搜索"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
          </div>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-96 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {keyword ? '未找到匹配的用户' : '输入关键词开始搜索'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {searchResults.map((user) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {user.isContact ? (
                        <>
                          <span className="text-sm text-gray-500">已添加</span>
                          <button
                            onClick={() => handleStartChat(user.id)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            发消息
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddContact(user.id)}
                          disabled={adding}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                        >
                          {adding ? '添加中...' : '添加'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
