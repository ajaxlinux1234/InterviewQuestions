import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// 发送消息 DTO
export class SendMessageDto {
  @IsNumber()
  conversationId: number;

  @IsEnum(['text', 'image', 'video', 'file'])
  type: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsNumber()
  mediaSize?: number;

  @IsOptional()
  @IsNumber()
  mediaDuration?: number;

  @IsOptional()
  @IsNumber()
  replyToMessageId?: number;
}

// 查询会话列表 DTO
export class QueryConversationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}

// 查询消息列表 DTO
export class QueryMessagesDto {
  @IsNumber()
  @Type(() => Number)
  conversationId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  beforeMessageId?: number;
}

// 创建会话 DTO
export class CreateConversationDto {
  @IsEnum(['private', 'group'])
  type: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsNumber({}, { each: true })
  memberIds: number[];
}

// 标记已读 DTO
export class MarkReadDto {
  @IsNumber()
  conversationId: number;

  @IsNumber()
  messageId: number;
}

// 会话响应 DTO
export class ConversationResponseDto {
  id: number;
  type: string;
  name?: string;
  avatar?: string;
  creatorId?: number;
  unreadCount: number;
  lastMessage?: {
    id: number;
    type: string;
    content?: string;
    senderId: number;
    senderName: string;
    createdAt: Date;
  };
  members?: Array<{
    id: number;
    userId: number;
    username: string;
    role: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// 消息响应 DTO
export class MessageResponseDto {
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
  createdAt: Date;
  updatedAt: Date;
}

// 联系人响应 DTO
export class ContactResponseDto {
  id: number;
  userId: number;
  contactUserId: number;
  contactUsername: string;
  contactEmail?: string;
  remark?: string;
  status: string;
  createdAt: Date;
}
