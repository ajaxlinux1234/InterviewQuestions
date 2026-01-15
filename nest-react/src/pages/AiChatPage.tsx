/**
 * AI 聊天页面
 * 
 * 提供与 AI 助手的对话界面，支持流式渲染
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiMessageRenderer, AiMessage } from '../components/AiMessageRenderer';
import { sseService, SSEChunk } from '../services/sseService';

export function AiChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageId = useRef<string | null>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      sseService.disconnect();
    };
  }, []);

  /**
   * 发送提示词
   */
  const sendPrompt = async () => {
    const prompt = inputValue.trim();
    
    if (!prompt) {
      return;
    }

    // 清空输入框
    setInputValue('');
    setError(null);
    setIsLoading(true);

    // 获取 token
    const token = localStorage.getItem('token');
    if (!token) {
      setError('请先登录');
      setIsLoading(false);
      navigate('/login');
      return;
    }

    // 添加用户提示消息
    const promptMessage: AiMessage = {
      tempId: `prompt_${Date.now()}`,
      content: prompt,
      type: 'ai_prompt',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, promptMessage]);

    // 创建临时 AI 响应消息
    const tempResponseId = `response_${Date.now()}`;
    currentStreamingMessageId.current = tempResponseId;
    
    const tempResponseMessage: AiMessage = {
      tempId: tempResponseId,
      content: '',
      type: 'ai_response',
      isStreaming: true,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempResponseMessage]);

    // 连接 SSE
    try {
      await sseService.connect(prompt, token, {
        onStart: (data: SSEChunk) => {
          console.log('[AiChatPage] Stream started:', data);
          setIsLoading(false);
        },

        onChunk: (data: SSEChunk) => {
          console.log('[AiChatPage] Received chunk:', data);
          handleStreamChunk(data);
        },

        onDone: (data: SSEChunk) => {
          console.log('[AiChatPage] Stream completed:', data);
          console.log('[AiChatPage] Current streaming message ID before complete:', currentStreamingMessageId.current);
          handleStreamComplete();
        },

        onError: (errorMessage: string, data?: SSEChunk) => {
          console.error('[AiChatPage] Stream error:', errorMessage, data);
          handleStreamError(errorMessage);
        },

        onClose: () => {
          console.log('[AiChatPage] Stream closed');
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error('[AiChatPage] Failed to connect:', error);
      const errorMessage = error instanceof Error ? error.message : '连接失败';
      handleStreamError(errorMessage);
    }
  };

  /**
   * 处理流式块
   */
  const handleStreamChunk = (chunk: SSEChunk) => {
    if (!currentStreamingMessageId.current) {
      return;
    }

    setMessages(prev => {
      return prev.map(msg => {
        if (msg.tempId === currentStreamingMessageId.current) {
          return {
            ...msg,
            content: msg.content + chunk.content,
            // 不要在这里修改 isStreaming，保持原有状态
          };
        }
        return msg;
      });
    });
  };

  /**
   * 处理流式完成
   */
  const handleStreamComplete = () => {
    console.log('[AiChatPage] handleStreamComplete called, currentStreamingMessageId:', currentStreamingMessageId.current);
    
    if (!currentStreamingMessageId.current) {
      console.log('[AiChatPage] No streaming message ID, returning early');
      return;
    }

    const messageIdToComplete = currentStreamingMessageId.current;
    
    setMessages(prev => {
      const updated = prev.map(msg => {
        if (msg.tempId === messageIdToComplete) {
          console.log('[AiChatPage] Setting isStreaming to false for message:', msg.tempId);
          console.log('[AiChatPage] Current isStreaming value:', msg.isStreaming);
          return {
            ...msg,
            isStreaming: false,
            metadata: {
              ...msg.metadata,
              responseLength: msg.content.length,
            },
          };
        }
        return msg;
      });
      console.log('[AiChatPage] Updated messages:', updated.map(m => ({ tempId: m.tempId, isStreaming: m.isStreaming })));
      return updated;
    });

    currentStreamingMessageId.current = null;
    setIsLoading(false);
    console.log('[AiChatPage] Stream complete handling finished');
  };

  /**
   * 处理流式错误
   */
  const handleStreamError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);

    if (currentStreamingMessageId.current) {
      // 移除失败的消息或标记为错误
      setMessages(prev => {
        return prev.map(msg => {
          if (msg.tempId === currentStreamingMessageId.current) {
            return {
              ...msg,
              isStreaming: false,
              content: msg.content || `错误: ${errorMessage}`,
            };
          }
          return msg;
        });
      });

      currentStreamingMessageId.current = null;
    }
  };

  /**
   * 停止流式生成
   */
  const stopStreaming = async () => {
    console.log('[AiChatPage] Stopping stream');
    await sseService.disconnect();
    handleStreamComplete();
  };

  /**
   * 处理输入框回车
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  };

  /**
   * 返回聊天列表
   */
  const goBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={goBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI 助手</h1>
              <p className="text-xs text-gray-500">由 Groq 提供支持</p>
            </div>
          </div>
        </div>

        {/* 连接状态 */}
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-purple-600">
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>连接中...</span>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">开始与 AI 助手对话</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              我可以帮你回答问题、提供建议、编写代码等。请在下方输入你的问题。
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <AiMessageRenderer
                key={message.id || message.tempId}
                message={message}
                onStop={message.isStreaming ? stopStreaming : undefined}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你的问题... (Shift+Enter 换行)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={sendPrompt}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>发送中</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>发送</span>
              </>
            )}
          </button>
        </div>
        
        {/* 提示文本 */}
        <div className="mt-2 text-xs text-gray-500 flex items-center space-x-4">
          <span>💡 提示: 按 Enter 发送，Shift+Enter 换行</span>
          <span>🔒 你的对话会被安全存储</span>
        </div>
      </div>
    </div>
  );
}
