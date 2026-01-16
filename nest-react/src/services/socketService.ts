/**
 * WebSocket 服务
 *
 * 管理与后端 Socket.IO 服务器的连接
 * 提供消息发送、接收、重连等功能
 */

import { io, Socket } from "socket.io-client";

// WebSocket 服务器地址
const SOCKET_URL = process.env.REACT_APP_WS_URL || "http://47.94.128.228:7002";

// 事件类型定义
export interface SendMessageData {
  conversationId: number;
  type: "text" | "image" | "video";
  content?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaDuration?: number;
  replyToMessageId?: number;
  tempId?: string; // 临时 ID，用于标识发送中的消息
}

export interface NewMessageData {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  type: string;
  content?: string;
  mediaUrl?: string;
  mediaSize?: number;
  mediaDuration?: number;
  replyToMessageId?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageSentData {
  messageId: number;
  tempId?: string;
}

export interface TypingData {
  conversationId: number;
  userId: number;
}

/**
 * Socket 服务类
 */
class SocketService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 初始重连延迟 1 秒
  private isManualDisconnect = false;

  /**
   * 连接到 WebSocket 服务器
   */
  connect(token: string): void {
    // 如果已经连接，不重复连接
    if (this.socket?.connected) {
      console.log("Socket 已连接，复用现有连接");
      return;
    }

    // 如果 socket 存在但未连接，先断开
    if (this.socket) {
      console.log("清理旧的 Socket 连接");
      this.socket.disconnect();
      this.socket = null;
    }

    this.token = token;
    this.isManualDisconnect = false;

    console.log("创建新的 Socket 连接...");

    // 创建 Socket 连接
    this.socket = io(`${SOCKET_URL}/im`, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      secure: true,
      rejectUnauthorized: false, // 开发环境忽略自签名证书
      reconnection: false, // 禁用自动重连，我们手动控制
    });

    // 连接成功
    this.socket.on(
      "connected",
      (data: { userId: number; socketId: string }) => {
        console.log("Socket 连接成功:", data);
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
      }
    );

    // 连接错误
    this.socket.on("connect_error", (error) => {
      console.error("Socket 连接错误:", error.message);
      this.handleReconnect();
    });

    // 断开连接
    this.socket.on("disconnect", (reason) => {
      console.log("Socket 断开连接:", reason);

      // 如果不是手动断开，尝试重连
      if (!this.isManualDisconnect && reason !== "io client disconnect") {
        this.handleReconnect();
      }
    });

    // 错误事件
    this.socket.on("error", (error: { message: string }) => {
      console.error("Socket 错误:", error.message);
    });
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.socket) {
      this.isManualDisconnect = true;
      this.socket.disconnect();
      this.socket = null;
      console.log("Socket 手动断开");
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * 处理重连
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("达到最大重连次数，停止重连");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数退避

    console.log(`${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连...`);

    setTimeout(() => {
      if (this.token && !this.isManualDisconnect) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * 监听事件
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      console.warn("Socket 未连接，无法监听事件:", event);
      return;
    }
    console.log(`注册 Socket 事件监听: ${event}`);
    console.log(`回调函数类型:`, typeof callback);
    console.log(`Socket 对象存在:`, !!this.socket);
    console.log(`Socket 已连接:`, this.socket.connected);
    this.socket.on(event, callback);
    console.log(`事件 ${event} 注册完成`);
  }

  /**
   * 取消监听事件
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) {
      return;
    }
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * 发送消息
   */
  sendMessage(data: SendMessageData): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法发送消息");
      return;
    }
    this.socket.emit("sendMessage", data);
  }

  /**
   * 加入会话房间
   */
  joinConversation(conversationId: number): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法加入会话");
      return;
    }
    this.socket.emit("joinConversation", { conversationId });
  }

  /**
   * 离开会话房间
   */
  leaveConversation(conversationId: number): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("leaveConversation", { conversationId });
  }

  /**
   * 标记消息已读
   */
  markAsRead(conversationId: number, messageId: number): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("markAsRead", { conversationId, messageId });
  }

  /**
   * 发送正在输入状态
   */
  typing(conversationId: number): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("typing", { conversationId });
  }

  /**
   * 发送停止输入状态
   */
  stopTyping(conversationId: number): void {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("stopTyping", { conversationId });
  }

  /**
   * WebRTC: 发送通话邀请
   */
  callInvite(
    toUserId: number,
    conversationId: number,
    callType: "audio" | "video"
  ): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法发送通话邀请");
      return;
    }
    this.socket.emit("callInvite", {
      targetUserId: toUserId,
      conversationId,
      callType,
    });
  }

  /**
   * WebRTC: 接受通话
   */
  callAccept(fromUserId: number, conversationId: number): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法接受通话");
      return;
    }
    this.socket.emit("callAccept", { callerId: fromUserId, conversationId });
  }

  /**
   * WebRTC: 拒绝通话
   */
  callReject(fromUserId: number, conversationId: number): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法拒绝通话");
      return;
    }
    this.socket.emit("callReject", { callerId: fromUserId, conversationId });
  }

  /**
   * WebRTC: 挂断通话
   */
  callHangup(toUserId: number, conversationId: number): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法挂断通话");
      return;
    }
    this.socket.emit("callHangup", { targetUserId: toUserId, conversationId });
  }

  /**
   * WebRTC: 发送 SDP Offer
   */
  webrtcOffer(toUserId: number, offer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法发送 Offer");
      return;
    }
    this.socket.emit("webrtcOffer", { targetUserId: toUserId, offer });
  }

  /**
   * WebRTC: 发送 SDP Answer
   */
  webrtcAnswer(toUserId: number, answer: RTCSessionDescriptionInit): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法发送 Answer");
      return;
    }
    this.socket.emit("webrtcAnswer", { targetUserId: toUserId, answer });
  }

  /**
   * WebRTC: 发送 ICE Candidate
   */
  webrtcIceCandidate(toUserId: number, candidate: RTCIceCandidateInit): void {
    if (!this.socket?.connected) {
      console.error("Socket 未连接，无法发送 ICE Candidate");
      return;
    }
    this.socket.emit("webrtcIceCandidate", {
      targetUserId: toUserId,
      candidate,
    });
  }
}

// 导出单例
export const socketService = new SocketService();
