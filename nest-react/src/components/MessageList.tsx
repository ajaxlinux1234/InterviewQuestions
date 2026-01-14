/**
 * 消息列表组件
 */

import { useEffect, useRef } from 'react';
import { Message } from '../stores/imStore';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>暂无消息</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.senderId === currentUserId;
        
        return (
          <div
            key={message.id || message.tempId}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end space-x-2 max-w-[70%] ${isOwn ? 'flex-row-reverse space-x-reverse' : '!items-start'}`}>
              {/* 头像 */}
              {!isOwn && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {message.senderName[0].toUpperCase()}
                </div>
              )}

              {/* 消息内容 */}
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {/* 发送者名称 */}
                {!isOwn && (
                  <div className="text-xs text-gray-500 mb-1 px-1">
                    {message.senderName}
                  </div>
                )}

                {/* 消息气泡 */}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  {message.type === 'text' && (
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  )}
                  
                  {message.type === 'image' && message.mediaUrl && (
                    <img
                      src={`https://192.168.1.199:7002${message.mediaUrl}`}
                      alt="图片"
                      className="max-w-sm rounded cursor-pointer hover:opacity-90"
                      onClick={() => window.open(`https://192.168.1.199:7002${message.mediaUrl}`, '_blank')}
                    />
                  )}
                  
                  {message.type === 'video' && message.mediaUrl && (
                    <video
                      src={`https://192.168.1.199:7002${message.mediaUrl}`}
                      controls
                      className="max-w-sm rounded"
                    />
                  )}
                </div>

                {/* 时间和状态 */}
                <div className="flex items-center space-x-2 mt-1 px-1">
                  <span className="text-xs text-gray-500">
                    {formatMessageTime(message.createdAt)}
                  </span>
                  {isOwn && (
                    <span className="text-xs text-gray-500">
                      {message.status === 'sending' && '发送中...'}
                      {message.status === 'sent' && '已发送'}
                      {message.status === 'delivered' && '已送达'}
                      {message.status === 'read' && '已读'}
                      {message.status === 'failed' && '发送失败'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

// 格式化消息时间
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
