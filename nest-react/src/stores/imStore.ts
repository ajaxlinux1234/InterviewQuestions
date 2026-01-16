/**
 * IM 状态管理
 *
 * 使用 Zustand 管理 IM 相关的全局状态
 */

import { create } from "zustand";

// 类型定义
export interface Contact {
  id: number;
  userId: number;
  contactUserId: number;
  contactUsername: string;
  contactEmail?: string;
  remark?: string;
  status: string;
  createdAt: string;
}

export interface ConversationMember {
  id: number;
  userId: number;
  username: string;
  role: string;
}

export interface LastMessage {
  id: number;
  type: string;
  content?: string;
  senderId: number;
  senderName: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  type: "private" | "group";
  name?: string;
  avatar?: string;
  creatorId?: number;
  unreadCount: number;
  lastMessage?: LastMessage;
  members?: ConversationMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  type: "text" | "image" | "video" | "system";
  content?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaDuration?: number;
  replyToMessageId?: number;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  createdAt: string;
  updatedAt: string;
  tempId?: string; // 临时 ID，用于标识发送中的消息
}

export const rtcInitStatus = ["notInit", "initing", "inited"] as const;

// Store 接口
interface ImStore {
  // 状态
  contacts: Contact[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  onlineUsers: number[];
  typingUsers: Map<number, number[]>; // conversationId -> userId[]
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
  removeContact: (id: number) => void;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: number, updates: Partial<Conversation>) => void;
  removeConversation: (id: number) => void;

  setCurrentConversation: (conversation: Conversation | null) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (
    messageId: number | string,
    updates: Partial<Message>
  ) => void;
  removeMessage: (messageId: number | string) => void;
  clearMessages: () => void;

  setOnlineUsers: (users: number[]) => void;
  addOnlineUser: (userId: number) => void;
  removeOnlineUser: (userId: number) => void;

  addTypingUser: (conversationId: number, userId: number) => void;
  removeTypingUser: (conversationId: number, userId: number) => void;

  // 重置所有状态
  reset: () => void;
}

// 创建 Store
export const useImStore = create<ImStore>((set) => ({
  // 初始状态
  contacts: [],
  conversations: [],
  currentConversation: null,
  messages: [],
  onlineUsers: [],
  typingUsers: new Map(),

  // 联系人操作
  setContacts: (contacts) => set({ contacts }),

  addContact: (contact) =>
    set((state) => ({
      contacts: [...state.contacts, contact],
    })),

  removeContact: (id) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    })),

  // 会话操作
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  // 消息操作
  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: state.messages.every((one) => one.id !== message.id)
        ? [...state.messages, message]
        : state.messages,
    })),

  updateMessage: (messageId, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId || m.tempId === messageId ? { ...m, ...updates } : m
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter(
        (m) => m.id !== messageId && m.tempId !== messageId
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  // 在线用户操作
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: Array.from(new Set([...state.onlineUsers, userId])),
    })),

  removeOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((id) => id !== userId),
    })),

  // 输入状态操作
  addTypingUser: (conversationId, userId) =>
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      const users = newTypingUsers.get(conversationId) || [];
      if (!users.includes(userId)) {
        newTypingUsers.set(conversationId, [...users, userId]);
      }
      return { typingUsers: newTypingUsers };
    }),

  removeTypingUser: (conversationId, userId) =>
    set((state) => {
      const newTypingUsers = new Map(state.typingUsers);
      const users = newTypingUsers.get(conversationId) || [];
      newTypingUsers.set(
        conversationId,
        users.filter((id) => id !== userId)
      );
      return { typingUsers: newTypingUsers };
    }),

  // 重置
  reset: () =>
    set({
      contacts: [],
      conversations: [],
      currentConversation: null,
      messages: [],
      onlineUsers: [],
      typingUsers: new Map(),
    }),
}));
