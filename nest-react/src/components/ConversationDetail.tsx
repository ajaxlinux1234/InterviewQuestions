/**
 * 会话详情组件
 */

import { Conversation } from '../stores/imStore';

interface ConversationDetailProps {
  conversation: Conversation;
  onClose: () => void;
}

export function ConversationDetail({ conversation, onClose }: ConversationDetailProps) {
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">会话详情</h2>
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-y-auto">
        {/* 会话信息 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-2xl mb-3">
              {conversation.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {conversation.name || '未命名会话'}
            </h3>
            <p className="text-sm text-gray-500">
              {conversation.type === 'private' ? '私聊' : '群聊'}
            </p>
          </div>
        </div>

        {/* 成员列表 */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            成员 ({conversation.members?.length || 0})
          </h4>
          <div className="space-y-2">
            {conversation.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {member.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {member.username}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.role === 'owner' && '群主'}
                    {member.role === 'admin' && '管理员'}
                    {member.role === 'member' && '成员'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span>消息免打扰</span>
            </div>
          </button>
          
          <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>清空聊天记录</span>
            </div>
          </button>
          
          {conversation.type === 'group' && (
            <button className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>退出群聊</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
