/**
 * AI 消息渲染组件
 * 
 * 用于渲染 AI 消息，支持流式渲染和停止功能
 */

import { useEffect, useRef } from 'react';

export interface AiMessage {
  id?: number;
  tempId?: string;
  content: string;
  type: 'ai_prompt' | 'ai_response';
  isStreaming?: boolean;
  createdAt: string;
  metadata?: {
    model?: string;
    chunkCount?: number;
    responseLength?: number;
  };
}

interface AiMessageRendererProps {
  message: AiMessage;
  onStop?: () => void;
}

export function AiMessageRenderer({ message, onStop }: AiMessageRendererProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const isPrompt = message.type === 'ai_prompt';
  const isStreaming = message.isStreaming || false;

  // 自动滚动到消息位置
  useEffect(() => {
    if (isStreaming && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [message.content, isStreaming]);

  return (
    <div
      ref={messageRef}
      className={`flex ${isPrompt ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start space-x-2 max-w-[80%] ${isPrompt ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* AI 头像 */}
        {!isPrompt && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        )}

        {/* 用户头像 */}
        {isPrompt && (
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* 消息内容 */}
        <div className={`flex flex-col ${isPrompt ? 'items-end' : 'items-start'}`}>
          {/* 发送者标签 */}
          <div className="text-xs text-gray-500 mb-1 px-1 flex items-center space-x-2">
            <span>{isPrompt ? '你' : 'AI 助手'}</span>
            {!isPrompt && message.metadata?.model && (
              <span className="text-xs text-gray-400">
                ({message.metadata.model})
              </span>
            )}
          </div>

          {/* 消息气泡 */}
          <div
            className={`rounded-lg px-4 py-3 ${
              isPrompt
                ? 'bg-blue-600 text-white'
                : 'bg-gradient-to-br from-purple-50 to-blue-50 text-gray-900 border border-purple-200'
            }`}
          >
            {/* 消息内容 */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
              
              {/* 流式输入指示器 */}
              {isStreaming && (
                <span className="inline-block ml-1 w-2 h-4 bg-current animate-pulse" />
              )}
            </div>

            {/* 停止按钮 */}
            {isStreaming && onStop && (
              <button
                onClick={onStop}
                className="mt-3 px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                停止生成
              </button>
            )}
          </div>

          {/* 时间和元数据 */}
          <div className="flex items-center space-x-2 mt-1 px-1">
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.createdAt)}
            </span>
            
            {/* 流式状态 */}
            {isStreaming && (
              <span className="text-xs text-purple-600 flex items-center space-x-1">
                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>生成中...</span>
              </span>
            )}
            
            {/* 完成状态 */}
            {!isStreaming && !isPrompt && message.metadata?.responseLength && (
              <span className="text-xs text-gray-400">
                {message.metadata.responseLength} 字符
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 格式化消息时间
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 如果是今天
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 如果是昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // 其他日期
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}
