import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ImService } from '../services/im.service';
import { SendMessageDto } from '../dto/im.dto';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'https://localhost:3000'],
    credentials: true,
  },
  namespace: '/im',
})
export class ImGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ImGateway.name);
  private userSockets: Map<number, Set<string>> = new Map(); // userId -> Set<socketId>

  constructor(
    private readonly imService: ImService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 客户端连接
   */
  async handleConnection(client: Socket) {
    try {
      // 从握手中获取 token
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`客户端 ${client.id} 连接失败: 缺少 token`);
        client.emit('error', { message: '缺少认证令牌' });
        client.disconnect();
        return;
      }

      // 使用 AuthService 验证 token（自定义令牌系统）
      const user = await this.authService.validateToken(token);

      if (!user) {
        this.logger.warn(`客户端 ${client.id} 认证失败: 无效的令牌`);
        client.emit('error', { message: '无效的认证令牌' });
        client.disconnect();
        return;
      }

      const userId = user.id;
      client.data.userId = userId;

      // 记录用户的 socket 连接
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(client.id);

      // 加入用户自己的房间
      client.join(`user:${userId}`);

      this.logger.log(`用户 ${userId} 通过 socket ${client.id} 连接成功`);

      // 通知客户端连接成功
      client.emit('connected', { userId, socketId: client.id });

    } catch (error) {
      this.logger.error(`客户端 ${client.id} 认证失败: ${error.message}`);
      client.emit('error', { message: '认证失败: ' + error.message });
      client.disconnect();
    }
  }

  /**
   * 客户端断开连接
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.log(`用户 ${userId} 的 socket ${client.id} 断开连接`);
    } else {
      this.logger.log(`未认证的 socket ${client.id} 断开连接`);
    }
  }

  /**
   * 发送消息
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        client.emit('error', { message: '未认证' });
        return;
      }

      this.logger.log(`用户 ${userId} 发送消息到会话 ${data.conversationId}`);

      // 保存消息
      const message = await this.imService.sendMessage(data, userId);

      // 获取会话详情，找出所有成员
      const conversation = await this.imService.getConversationDetail(data.conversationId, userId);

      // 向会话中的所有在线成员发送消息（除了发送者自己）
      conversation.members.forEach(member => {
        // 跳过发送者自己
        if (member.userId === userId) {
          return;
        }
        
        const memberSockets = this.userSockets.get(member.userId);
        if (memberSockets) {
          memberSockets.forEach(socketId => {
            this.server.to(socketId).emit('newMessage', message);
          });
        }
      });

      // 确认消息发送成功（只发给发送者）
      client.emit('messageSent', { messageId: message.id, tempId: data['tempId'] });

    } catch (error) {
      this.logger.error('发送消息失败:', error);
      client.emit('error', { message: error.message || '发送消息失败' });
    }
  }

  /**
   * 加入会话房间
   */
  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        client.emit('error', { message: '未认证' });
        return;
      }

      const roomName = `conversation:${data.conversationId}`;
      client.join(roomName);

      this.logger.log(`用户 ${userId} 加入会话房间 ${roomName}`);
      client.emit('joinedConversation', { conversationId: data.conversationId });

    } catch (error) {
      this.logger.error('加入会话失败:', error);
      client.emit('error', { message: '加入会话失败' });
    }
  }

  /**
   * 离开会话房间
   */
  @SubscribeMessage('leaveConversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    try {
      const roomName = `conversation:${data.conversationId}`;
      client.leave(roomName);

      this.logger.log(`Socket ${client.id} 离开会话房间 ${roomName}`);
      client.emit('leftConversation', { conversationId: data.conversationId });

    } catch (error) {
      this.logger.error('离开会话失败:', error);
    }
  }

  /**
   * 标记消息已读
   */
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number; messageId: number },
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId) {
        client.emit('error', { message: '未认证' });
        return;
      }

      await this.imService.markAsRead(data, userId);

      // 通知会话中的其他成员
      this.server.to(`conversation:${data.conversationId}`).emit('messageRead', {
        conversationId: data.conversationId,
        messageId: data.messageId,
        userId,
      });

    } catch (error) {
      this.logger.error('标记已读失败:', error);
      client.emit('error', { message: '标记已读失败' });
    }
  }

  /**
   * 用户正在输入
   */
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = client.data.userId;
    
    if (!userId) {
      return;
    }

    // 通知会话中的其他成员
    client.to(`conversation:${data.conversationId}`).emit('userTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }

  /**
   * 用户停止输入
   */
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: number },
  ) {
    const userId = client.data.userId;
    
    if (!userId) {
      return;
    }

    // 通知会话中的其他成员
    client.to(`conversation:${data.conversationId}`).emit('userStopTyping', {
      conversationId: data.conversationId,
      userId,
    });
  }

  /**
   * 获取在线用户列表
   */
  getOnlineUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * 向指定用户发送消息
   */
  sendToUser(userId: number, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
