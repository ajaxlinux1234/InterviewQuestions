/**
 * AI 聊天页面
 * 
 * 提供与 AI 助手的对话界面，支持流式渲染
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiMessageRenderer, AiMessage } from '../components/AiMessageRenderer';
import { sseService, SSEChunk } from '../services/sseService';
import { aiConversationService, AiConversation } from '../services/aiConversationService';

export function AiChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamingMessageId = useRef<string | null>(null);

  // 会话管理状态
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

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

  // 加载会话列表
  useEffect(() => {
    loadConversations();
  }, []);

  /**
   * 加载会话列表
   */
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const convs = await aiConversationService.getConversations();
      setConversations(convs);
    } catch (error) {
      console.error('[AiChatPage] Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  /**
   * 创建新会话
   */
  const createNewConversation = async () => {
    try {
      const newConv = await aiConversationService.createConversation('新对话');
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setMessages([]);
      setShowConversationList(false);
    } catch (error) {
      console.error('[AiChatPage] Failed to create conversation:', error);
      setError('创建会话失败');
    }
  };

  /**
   * 切换会话
   */
  const switchConversation = async (conversationId: number) => {
    try {
      setIsLoading(true);
      const detail = await aiConversationService.getConversationDetail(conversationId);
      
      // 转换消息格式
      const loadedMessages: AiMessage[] = detail.messages.map(msg => ({
        id: msg.id,
        tempId: `msg_${msg.id}`,
        content: msg.content,
        type: msg.type,
        isStreaming: false,
        createdAt: msg.createdAt,
        metadata: msg.metadata,
      }));

      setMessages(loadedMessages);
      setCurrentConversationId(conversationId);
      setShowConversationList(false);
    } catch (error) {
      console.error('[AiChatPage] Failed to switch conversation:', error);
      setError('加载会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 删除会话
   */
  const deleteConversation = async (conversationId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('确定要删除这个会话吗？')) {
      return;
    }

    try {
      await aiConversationService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // 如果删除的是当前会话，清空消息
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('[AiChatPage] Failed to delete conversation:', error);
      setError('删除会话失败');
    }
  };

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

    // 如果没有当前会话，创建新会话
    let conversationId = currentConversationId;
    if (!conversationId) {
      try {
        const newConv = await aiConversationService.createConversation();
        conversationId = newConv.id;
        setCurrentConversationId(conversationId);
        setConversations(prev => [newConv, ...prev]);
      } catch (error) {
        console.error('[AiChatPage] Failed to create conversation:', error);
        setError('创建会话失败');
        setIsLoading(false);
        return;
      }
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

    // 连接 SSE（传递会话 ID）
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
          // 刷新会话列表（更新消息计数和时间）
          loadConversations();
        },

        onError: (errorMessage: string, data?: SSEChunk) => {
          console.error('[AiChatPage] Stream error:', errorMessage, data);
          handleStreamError(errorMessage);
        },

        onClose: () => {
          console.log('[AiChatPage] Stream closed');
          setIsLoading(false);
        },
      }, conversationId);
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
    currentStreamingMessageId.current = null;
    setIsLoading(false);
    
    // 使用 setTimeout 确保状态更新在下一个事件循环中执行
    // 这样可以避免 React 批处理导致的状态更新问题
    setTimeout(() => {
      setMessages(prev => {
        const updated = prev.map(msg => {
          if (msg.tempId === messageIdToComplete) {
            console.log('[AiChatPage] Setting isStreaming to false for message:', msg.tempId);
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
    }, 0);
    
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="flex h-screen bg-gray-50">
      {/* 会话列表侧边栏 */}
      <div className={`${showConversationList ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">对话历史</h2>
            <button
              onClick={() => setShowConversationList(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <button
            onClick={createNewConversation}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新建对话</span>
          </button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <svg className="w-6 h-6 animate-spin text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              暂无对话历史
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => switchConversation(conv.id)}
                className={`p-3 mb-2 rounded-lg cursor-pointer transition-all ${
                  conv.id === currentConversationId
                    ? 'bg-purple-50 border-2 border-purple-200'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {conv.messageCount} 条消息 · {new Date(conv.updatedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex flex-col flex-1">
        {/* 顶部导航栏 */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* 会话列表切换按钮 */}
          <button
            onClick={() => setShowConversationList(!showConversationList)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            title="对话历史"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

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
              onKeyDown={handleKeyDown}
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
    </div>
  );
}
