/**
 * IM 即时通讯模块
 * 
 * 整合 IM 相关的所有组件：
 * 1. ImController - REST API 控制器
 * 2. ImService - 业务逻辑服务
 * 3. ImGateway - WebSocket 网关
 * 4. 实体类 - Contact, Conversation, ConversationMember, Message
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImController } from '../controllers/im.controller';
import { ImService } from '../services/im.service';
import { ImGateway } from '../gateways/im.gateway';
import { Contact } from '../entities/contact.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * IM 模块配置
 * 
 * @Module 装饰器说明：
 * - imports: 导入需要的模块
 *   - TypeOrmModule.forFeature: 注册实体类，使其可以在服务中注入
 *   - AuthModule: 导入认证模块，以便使用 JwtService 和 JwtAuthGuard
 * 
 * - controllers: 注册控制器
 *   - ImController: 处理 REST API 请求
 * 
 * - providers: 注册服务提供者
 *   - ImService: 业务逻辑服务
 *   - ImGateway: WebSocket 网关
 * 
 * - exports: 导出服务，使其可以在其他模块中使用
 *   - ImService: 其他模块可能需要调用 IM 服务
 *   - ImGateway: 其他模块可能需要向用户推送消息
 */
@Module({
  imports: [
    // 注册 IM 相关的实体类
    TypeOrmModule.forFeature([
      Contact,              // 联系人表
      Conversation,         // 会话表
      ConversationMember,   // 会话成员表
      Message,              // 消息表
      User,                 // 用户表（需要关联用户信息）
    ]),
    
    // 导入认证模块
    // 这样可以在 ImController 中使用 JwtAuthGuard
    // 在 ImGateway 中使用 JwtService 验证 token
    AuthModule,
  ],
  
  // 注册控制器
  controllers: [ImController],
  
  // 注册服务提供者
  providers: [
    ImService,   // IM 业务逻辑服务
    ImGateway,   // WebSocket 网关
  ],
  
  // 导出服务，供其他模块使用
  exports: [
    ImService,   // 导出 ImService，其他模块可以调用 IM 功能
    ImGateway,   // 导出 ImGateway，其他模块可以推送实时消息
  ],
})
export class ImModule {
  /**
   * IM 模块说明：
   * 
   * 1. REST API 接口（通过 ImController）：
   *    - GET  /api/im/contacts - 获取联系人列表
   *    - POST /api/im/contacts - 添加联系人
   *    - GET  /api/im/conversations - 获取会话列表
   *    - POST /api/im/conversations - 创建会话
   *    - GET  /api/im/messages - 获取消息列表
   *    - POST /api/im/messages - 发送消息
   *    - POST /api/im/upload/image - 上传图片
   *    - POST /api/im/upload/video - 上传视频
   * 
   * 2. WebSocket 接口（通过 ImGateway）：
   *    - 命名空间: /im
   *    - 事件:
   *      - sendMessage - 发送消息
   *      - joinConversation - 加入会话房间
   *      - leaveConversation - 离开会话房间
   *      - markAsRead - 标记已读
   *      - typing - 正在输入
   *      - stopTyping - 停止输入
   * 
   * 3. 数据库表：
   *    - contacts - 联系人表
   *    - conversations - 会话表
   *    - conversation_members - 会话成员表
   *    - messages - 消息表
   * 
   * 4. 文件上传：
   *    - 图片: 最大 5MB，支持 jpg/jpeg/png/gif
   *    - 视频: 最大 50MB，支持 mp4/mov/avi
   *    - 存储路径: nest/uploads/im/images 和 nest/uploads/im/videos
   * 
   * 5. 认证机制：
   *    - REST API: 使用 JwtAuthGuard 保护所有接口
   *    - WebSocket: 在握手时验证 JWT token
   */
}
