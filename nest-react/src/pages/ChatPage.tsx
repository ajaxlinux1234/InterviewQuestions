/**
 * 聊天页面
 * 
 * 三栏布局：
 * - 左侧：联系人/会话列表
 * - 中间：消息列表和输入框
 * - 右侧：会话详情
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useImStore } from '../stores/imStore';
import { socketService } from '../services/socketService';
import { getContacts, getConversations, getMessages, clearConversations, createConversation } from '../services/imApi';
import { ConversationList } from '../components/ConversationList';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { ConversationDetail } from '../components/ConversationDetail';
import { AddContactModal } from '../components/AddContactModal';

export function ChatPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'conversations' | 'contacts'>('conversations');
  const [showDetail, setShowDetail] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  
  const {
    contacts,
    conversations,
    currentConversation,
    messages,
    setContacts,
    setConversations,
    setCurrentConversation,
    setMessages,
    addMessage,
    updateMessage,
  } = useImStore();

  // 获取联系人列表
  const { data: contactsData, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: getContacts,
  });

  // 获取会话列表
  const { data: conversationsData, refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getConversations({ page: 1, limit: 50 }),
  });

  // 获取当前会话的消息
  const { data: messagesData } = useQuery({
    queryKey: ['messages', currentConversation?.id],
    queryFn: () =>
      currentConversation
        ? getMessages({ conversationId: currentConversation.id, page: 1, limit: 50 })
        : Promise.resolve(null),
    enabled: !!currentConversation,
  });

  // 初始化数据
  useEffect(() => {
    if (contactsData) {
      setContacts(contactsData as any);
    }
  }, [contactsData, setContacts]);

  useEffect(() => {
    if (conversationsData?.data) {
      setConversations(conversationsData.data as any);
    }
  }, [conversationsData, setConversations]);

  useEffect(() => {
    if (messagesData?.data) {
      setMessages(messagesData.data as any);
    }
  }, [messagesData, setMessages]);

  // 初始化 WebSocket 连接（只在组件挂载时执行一次）
  useEffect(() => {
    // 从 localStorage 直接读取 token（不依赖 Zustand）
    let token = localStorage.getItem('token');
    
    // 如果直接读取失败，尝试从 Zustand persist 存储中读取
    if (!token) {
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed.state?.token;
        }
      } catch (e) {
        console.error('解析 auth-storage 失败:', e);
      }
    }
    
    if (!token) {
      console.error('未找到 token，跳转到登录页');
      navigate('/login');
      return;
    }

    // 连接 WebSocket（如果已连接会复用）
    socketService.connect(token);

    // 监听新消息
    const handleNewMessage = (message: any) => {
      console.log('收到新消息:', message);
      
      // 获取当前用户 ID
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 只有当消息不是自己发送的时候才添加到消息列表
      // 自己发送的消息已经通过 MessageInput 添加了临时消息
      if (message.senderId !== currentUser.id) {
        addMessage(message);
      }
      
      // 如果是当前会话的消息，标记为已读
      if (currentConversation && message.conversationId === currentConversation.id) {
        socketService.markAsRead(message.conversationId, message.id);
      }
      
      // 刷新会话列表（更新最后一条消息和未读数）
      refetchConversations();
    };

    // 监听消息发送成功
    const handleMessageSent = (data: { messageId: number; tempId?: string }) => {
      console.log('消息发送成功:', data);
      if (data.tempId) {
        updateMessage(data.tempId, { id: data.messageId, status: 'sent' });
      }
    };

    // 监听用户正在输入
    const handleUserTyping = (data: { conversationId: number; userId: number }) => {
      console.log('用户正在输入:', data);
      // TODO: 显示输入状态
    };

    // 监听用户停止输入
    const handleUserStopTyping = (data: { conversationId: number; userId: number }) => {
      console.log('用户停止输入:', data);
      // TODO: 隐藏输入状态
    };

    // 注册事件监听器
    socketService.on('newMessage', handleNewMessage);
    socketService.on('messageSent', handleMessageSent);
    socketService.on('userTyping', handleUserTyping);
    socketService.on('userStopTyping', handleUserStopTyping);

    // 清理：只移除事件监听器，不断开连接
    return () => {
      socketService.off('newMessage', handleNewMessage);
      socketService.off('messageSent', handleMessageSent);
      socketService.off('userTyping', handleUserTyping);
      socketService.off('userStopTyping', handleUserStopTyping);
      // 注意：不调用 disconnect()，保持连接
    };
  }, [navigate]); // 只依赖 navigate，避免重复连接

  // 单独处理新消息的已读标记（当 currentConversation 变化时）
  useEffect(() => {
    // 这个 effect 不需要做任何事，已读标记在 handleNewMessage 中处理
  }, [currentConversation]);

  // 加入/离开会话房间，并标记历史消息为已读
  useEffect(() => {
    if (currentConversation) {
      socketService.joinConversation(currentConversation.id);
      
      // 标记当前会话的所有消息为已读
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.id > 0) {
          socketService.markAsRead(currentConversation.id, lastMessage.id);
        }
      }
      
      return () => {
        socketService.leaveConversation(currentConversation.id);
      };
    }
  }, [currentConversation, messages]);

  // 处理会话选择
  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    setShowDetail(false);
  };

  // 处理返回
  const handleBack = () => {
    navigate('/dashboard');
  };

  // 处理清空会话列表
  const handleClearConversations = async () => {
    if (!window.confirm('确定要清空所有会话吗？此操作不可恢复。')) {
      return;
    }

    try {
      await clearConversations();
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      refetchConversations();
      alert('会话列表已清空');
    } catch (error) {
      console.error('清空会话失败:', error);
      alert('清空会话失败，请重试');
    }
  };

  // 处理清空聊天记录
  const handleMessagesCleared = () => {
    // 清空当前会话的消息列表
    setMessages([]);
  };

  // 处理点击联系人 - 打开与该联系人的聊天
  const handleContactClick = async (contact: any) => {
    try {
      // 查找是否已存在与该联系人的私聊会话
      const existingConversation = conversations.find(
        (conv) =>
          conv.type === 'private' &&
          conv.members?.some((m) => m.userId === contact.contactUserId)
      );

      if (existingConversation) {
        // 如果已存在会话,直接选中
        setCurrentConversation(existingConversation);
        setActiveTab('conversations');
      } else {
        // 如果不存在会话,创建新的私聊会话
        const response = await createConversation({
          type: 'private',
          memberIds: [contact.contactUserId],
        });

        // 刷新会话列表
        await refetchConversations();

        // 选中新创建的会话
        setCurrentConversation(response as any);
        setActiveTab('conversations');
      }
    } catch (error) {
      console.error('打开聊天失败:', error);
      alert('打开聊天失败，请重试');
    }
  };

  // 处理添加联系人成功
  const handleAddContactSuccess = () => {
    refetchContacts();
    refetchConversations();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">聊天</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {socketService.isConnected() ? '🟢 在线' : '🔴 离线'}
          </span>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧栏 - 联系人/会话列表 */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* 标签切换 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('conversations')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'conversations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              会话 ({conversations.length})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'contacts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              联系人 ({contacts.length})
            </button>
          </div>

          {/* 操作按钮栏 */}
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            {activeTab === 'conversations' ? (
              <>
                <span className="text-sm text-gray-600">会话管理</span>
                <button
                  onClick={handleClearConversations}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  清空列表
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-gray-600">联系人管理</span>
                <button
                  onClick={() => setShowAddContact(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + 添加联系人
                </button>
              </>
            )}
          </div>

          {/* 列表内容 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'conversations' ? (
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                onSelect={handleSelectConversation}
              />
            ) : (
              <div className="p-4">
                {contacts.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    暂无联系人
                  </div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleContactClick(contact)}
                        className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {contact.contactUsername[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {contact.remark || contact.contactUsername}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {contact.contactEmail}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 中间栏 - 消息列表和输入框 */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {currentConversation ? (
            <>
              {/* 会话头部 */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                    {currentConversation.name?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentConversation.name || '未命名会话'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentConversation.members?.length || 0} 人
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* 消息列表 */}
              <MessageList messages={messages} />

              {/* 输入框 */}
              <MessageInput conversationId={currentConversation.id} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">选择一个会话开始聊天</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧栏 - 会话详情 */}
        {showDetail && currentConversation && (
          <ConversationDetail
            conversation={currentConversation}
            onClose={() => setShowDetail(false)}
            onMessagesCleared={handleMessagesCleared}
          />
        )}
      </div>

      {/* 添加联系人模态框 */}
      {showAddContact && (
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onSuccess={handleAddContactSuccess}
        />
      )}
    </div>
  );
}
