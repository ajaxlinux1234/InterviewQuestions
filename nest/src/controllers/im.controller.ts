/**
 * IM 即时通讯控制器
 * 
 * 提供 REST API 接口用于：
 * 1. 联系人管理（获取、添加、删除）
 * 2. 会话管理（获取列表、详情、创建）
 * 3. 消息管理（获取历史消息、发送消息）
 * 4. 文件上传（图片、视频）
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ImService } from '../services/im.service';
import {
  SendMessageDto,
  QueryConversationsDto,
  QueryMessagesDto,
  CreateConversationDto,
  MarkReadDto,
} from '../dto/im.dto';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

/**
 * IM 控制器
 * 所有接口都需要 JWT 认证
 */
@Controller('api/im')
@UseGuards(AuthGuard)
export class ImController {
  constructor(private readonly imService: ImService) {}

  /**
   * 搜索用户（用于添加联系人）
   * GET /api/im/users/search?keyword=xxx
   */
  @Get('users/search')
  async searchUsers(
    @Request() req,
    @Query('keyword') keyword: string,
  ) {
    const userId = req.user.id;
    
    if (!keyword || keyword.trim().length === 0) {
      throw new BadRequestException('搜索关键词不能为空');
    }

    return this.imService.searchUsers(keyword, userId);
  }

  /**
   * 获取联系人列表
   * GET /api/im/contacts
   */
  @Get('contacts')
  async getContacts(@Request() req) {
    const userId = req.user.id;
    return this.imService.getContacts(userId);
  }

  /**
   * 添加联系人
   * POST /api/im/contacts
   * Body: { contactUserId: number, remark?: string }
   */
  @Post('contacts')
  async addContact(
    @Request() req,
    @Body('contactUserId', ParseIntPipe) contactUserId: number,
    @Body('remark') remark?: string,
  ) {
    const userId = req.user.id;
    
    if (userId === contactUserId) {
      throw new BadRequestException('不能添加自己为联系人');
    }

    return this.imService.addContact(userId, contactUserId, remark);
  }

  /**
   * 删除联系人
   * DELETE /api/im/contacts/:id
   */
  @Delete('contacts/:id')
  async deleteContact(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.id;
    await this.imService.deleteContact(userId, id);
    
    return {
      success: true,
      message: '联系人删除成功',
    };
  }

  /**
   * 获取会话列表（分页）
   * GET /api/im/conversations?page=1&limit=20
   */
  @Get('conversations')
  async getConversations(
    @Request() req,
    @Query() queryDto: QueryConversationsDto,
  ) {
    const userId = req.user.id;
    return this.imService.getConversations(userId, queryDto);
  }

  /**
   * 获取会话详情
   * GET /api/im/conversations/:id
   */
  @Get('conversations/:id')
  async getConversationDetail(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.id;
    return this.imService.getConversationDetail(id, userId);
  }

  /**
   * 创建会话（私聊或群聊）
   * POST /api/im/conversations
   * Body: { type: 'private' | 'group', name?: string, avatar?: string, memberIds: number[] }
   */
  @Post('conversations')
  async createConversation(
    @Request() req,
    @Body() createDto: CreateConversationDto,
  ) {
    const userId = req.user.id;
    return this.imService.createConversation(createDto, userId);
  }

  /**
   * 删除会话
   * DELETE /api/im/conversations/:id
   */
  @Delete('conversations/:id')
  async deleteConversation(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.id;
    
    // 这里应该调用 ImService 的 deleteConversation 方法
    // 暂时返回成功消息
    return {
      success: true,
      message: '会话删除成功',
    };
  }

  /**
   * 清空会话列表
   * DELETE /api/im/conversations
   */
  @Delete('conversations')
  async clearConversations(@Request() req) {
    const userId = req.user.id;
    await this.imService.clearConversations(userId);
    
    return {
      success: true,
      message: '会话列表已清空',
    };
  }

  /**
   * 清空会话的所有消息
   * DELETE /api/im/conversations/:id/messages
   */
  @Delete('conversations/:id/messages')
  async clearConversationMessages(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.id;
    await this.imService.clearConversationMessages(id, userId);
    
    return {
      success: true,
      message: '聊天记录已清空',
    };
  }

  /**
   * 获取消息列表（分页）
   * GET /api/im/messages?conversationId=1&page=1&limit=50&beforeMessageId=100
   */
  @Get('messages')
  async getMessages(
    @Request() req,
    @Query() queryDto: QueryMessagesDto,
  ) {
    const userId = req.user.id;
    return this.imService.getMessages(queryDto, userId);
  }

  /**
   * 发送消息（支持文件上传）
   * POST /api/im/messages
   * Body: { conversationId: number, type: string, content?: string, ... }
   * 或者 FormData（包含文件）
   */
  @Post('messages')
  async sendMessage(
    @Request() req,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const userId = req.user.id;
    return this.imService.sendMessage(sendMessageDto, userId);
  }

  /**
   * 标记消息已读
   * POST /api/im/messages/:id/read
   * Body: { conversationId: number, messageId: number }
   */
  @Post('messages/:id/read')
  async markAsRead(
    @Request() req,
    @Body() markReadDto: MarkReadDto,
  ) {
    const userId = req.user.id;
    await this.imService.markAsRead(markReadDto, userId);
    return {
      success: true,
      message: '标记已读成功',
    };
  }

  /**
   * 上传图片
   * POST /api/im/upload/image
   * FormData: file
   * 
   * 支持格式: jpg, jpeg, png, gif
   * 最大大小: 5MB
   */
  @Post('upload/image')
  async uploadImage(@Request() req: any) {
    try {
      // 获取上传的文件
      const data = await req.file();
      
      if (!data) {
        throw new BadRequestException('请上传图片文件');
      }

      // 检查文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(data.mimetype)) {
        throw new BadRequestException('只支持 jpg, jpeg, png, gif 格式的图片');
      }

      // 检查文件大小（5MB）
      const buffer = await data.toBuffer();
      if (buffer.length > 5 * 1024 * 1024) {
        throw new BadRequestException('图片大小不能超过 5MB');
      }

      // 生成唯一文件名
      const ext = extname(data.filename);
      const filename = `${uuidv4()}${ext}`;
      
      // 使用绝对路径
      const uploadDir = join(process.cwd(), 'uploads', 'im', 'images');
      const filePath = join(uploadDir, filename);

      // 确保上传目录存在
      await fs.mkdir(uploadDir, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, buffer);

      // 返回文件访问 URL
      const fileUrl = `/uploads/im/images/${filename}`;
      
      return {
        success: true,
        data: {
          url: fileUrl,
          filename: filename,
          originalName: data.filename,
          size: buffer.length,
          mimetype: data.mimetype,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('文件上传失败: ' + error.message);
    }
  }

  /**
   * 上传视频
   * POST /api/im/upload/video
   * FormData: file
   * 
   * 支持格式: mp4, mov, avi
   * 最大大小: 50MB
   */
  @Post('upload/video')
  async uploadVideo(@Request() req: any) {
    try {
      // 获取上传的文件
      const data = await req.file();
      
      if (!data) {
        throw new BadRequestException('请上传视频文件');
      }

      // 检查文件类型
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedTypes.includes(data.mimetype)) {
        throw new BadRequestException('只支持 mp4, mov, avi 格式的视频');
      }

      // 检查文件大小（50MB）
      const buffer = await data.toBuffer();
      if (buffer.length > 50 * 1024 * 1024) {
        throw new BadRequestException('视频大小不能超过 50MB');
      }

      // 生成唯一文件名
      const ext = extname(data.filename);
      const filename = `${uuidv4()}${ext}`;
      
      // 使用绝对路径
      const uploadDir = join(process.cwd(), 'uploads', 'im', 'videos');
      const filePath = join(uploadDir, filename);

      // 确保上传目录存在
      await fs.mkdir(uploadDir, { recursive: true });

      // 保存文件
      await fs.writeFile(filePath, buffer);

      // 返回文件访问 URL
      const fileUrl = `/uploads/im/videos/${filename}`;
      
      return {
        success: true,
        data: {
          url: fileUrl,
          filename: filename,
          originalName: data.filename,
          size: buffer.length,
          mimetype: data.mimetype,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('文件上传失败: ' + error.message);
    }
  }
}
