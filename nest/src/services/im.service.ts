import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { Conversation } from '../entities/conversation.entity';
import { ConversationMember } from '../entities/conversation-member.entity';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import {
  SendMessageDto,
  QueryConversationsDto,
  QueryMessagesDto,
  CreateConversationDto,
  MarkReadDto,
  ConversationResponseDto,
  MessageResponseDto,
  ContactResponseDto,
} from '../dto/im.dto';

@Injectable()
export class ImService {
  private readonly logger = new Logger(ImService.name);

  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember)
    private conversationMemberRepository: Repository<ConversationMember>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取联系人列表
   */
  async getContacts(userId: number): Promise<ContactResponseDto[]> {
    this.logger.log(`获取用户 ${userId} 的联系人列表`);

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .leftJoinAndSelect('contact.contactUser', 'user')
      .where('contact.userId = :userId', { userId })
      .andWhere('contact.status = :status', { status: 'normal' })
      .orderBy('contact.createdAt', 'DESC')
      .getMany();

    return contacts.map(contact => ({
      id: contact.id,
      userId: contact.userId,
      contactUserId: contact.contactUserId,
      contactUsername: contact.contactUser.username,
      contactEmail: contact.contactUser.email,
      remark: contact.remark,
      status: contact.status,
      createdAt: contact.createdAt,
    }));
  }

  /**
   * 获取会话列表
   */
  async getConversations(userId: number, queryDto: QueryConversationsDto): Promise<{
    data: ConversationResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    this.logger.log(`获取用户 ${userId} 的会话列表`);

    const { page = 1, limit = 20 } = queryDto;
    const offset = (page - 1) * limit;

    // 获取用户参与的会话
    const [members, total] = await this.conversationMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.conversation', 'conversation')
      .where('member.userId = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const conversationIds = members.map(m => m.conversationId);

    if (conversationIds.length === 0) {
      return { data: [], total: 0, page, limit };
    }

    // 获取每个会话的最后一条消息
    const lastMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversationId IN (:...conversationIds)', { conversationIds })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(m2.id)')
          .from(Message, 'm2')
          .where('m2.conversationId = message.conversationId')
          .getQuery();
        return 'message.id = ' + subQuery;
      })
      .getMany();

    // 获取所有会话成员
    const allMembers = await this.conversationMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.conversationId IN (:...conversationIds)', { conversationIds })
      .getMany();

    // 组装响应数据
    const data: ConversationResponseDto[] = await Promise.all(members.map(async (member) => {
      const conversation = member.conversation;
      const lastMessage = lastMessages.find(m => m.conversationId === conversation.id);
      const conversationMembers = allMembers.filter(m => m.conversationId === conversation.id);
      
      // 计算未读消息数
      let unreadCount = 0;
      if (lastMessage) {
        if (member.lastReadMessageId) {
          // 查询在 lastReadMessageId 之后的消息数量
          unreadCount = await this.messageRepository
            .createQueryBuilder('message')
            .where('message.conversationId = :conversationId', { conversationId: conversation.id })
            .andWhere('message.id > :lastReadMessageId', { lastReadMessageId: member.lastReadMessageId })
            .andWhere('message.senderId != :userId', { userId }) // 不计算自己发送的消息
            .getCount();
        } else {
          // 如果没有已读记录，计算所有不是自己发送的消息
          unreadCount = await this.messageRepository
            .createQueryBuilder('message')
            .where('message.conversationId = :conversationId', { conversationId: conversation.id })
            .andWhere('message.senderId != :userId', { userId })
            .getCount();
        }
      }

      // 对于私聊，使用对方的信息作为会话名称和头像
      let displayName = conversation.name;
      let displayAvatar = conversation.avatar;
      
      if (conversation.type === 'private') {
        const otherMember = conversationMembers.find(m => m.userId !== userId);
        if (otherMember) {
          displayName = otherMember.user.username;
          displayAvatar = otherMember.user.email; // 可以用邮箱生成头像
        }
      }

      return {
        id: conversation.id,
        type: conversation.type,
        name: displayName,
        avatar: displayAvatar,
        creatorId: conversation.creatorId,
        unreadCount,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          type: lastMessage.type,
          content: lastMessage.content,
          senderId: lastMessage.senderId,
          senderName: lastMessage.sender.username,
          createdAt: lastMessage.createdAt,
        } : undefined,
        members: conversationMembers.map(m => ({
          id: m.id,
          userId: m.userId,
          username: m.user.username,
          role: m.role,
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    }));

    return { data, total, page, limit };
  }

  /**
   * 获取会话详情
   */
  async getConversationDetail(conversationId: number, userId: number): Promise<ConversationResponseDto> {
    this.logger.log(`获取会话 ${conversationId} 详情`);

    // 验证用户是否是会话成员
    const member = await this.conversationMemberRepository.findOne({
      where: { conversationId, userId },
    });

    if (!member) {
      throw new NotFoundException('会话不存在或您不是会话成员');
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('会话不存在');
    }

    // 获取所有成员
    const members = await this.conversationMemberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .where('member.conversationId = :conversationId', { conversationId })
      .getMany();

    // 获取最后一条消息
    const lastMessage = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .limit(1)
      .getOne();

    // 对于私聊，使用对方的信息
    let displayName = conversation.name;
    let displayAvatar = conversation.avatar;
    
    if (conversation.type === 'private') {
      const otherMember = members.find(m => m.userId !== userId);
      if (otherMember) {
        displayName = otherMember.user.username;
        displayAvatar = otherMember.user.email;
      }
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: displayName,
      avatar: displayAvatar,
      creatorId: conversation.creatorId,
      unreadCount: 0,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        type: lastMessage.type,
        content: lastMessage.content,
        senderId: lastMessage.senderId,
        senderName: lastMessage.sender.username,
        createdAt: lastMessage.createdAt,
      } : undefined,
      members: members.map(m => ({
        id: m.id,
        userId: m.userId,
        username: m.user.username,
        role: m.role,
      })),
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  /**
   * 获取消息列表
   */
  async getMessages(queryDto: QueryMessagesDto, userId: number): Promise<{
    data: MessageResponseDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const { conversationId, page = 1, limit = 50, beforeMessageId } = queryDto;

    this.logger.log(`获取会话 ${conversationId} 的消息列表`);

    // 验证用户是否是会话成员
    const member = await this.conversationMemberRepository.findOne({
      where: { conversationId, userId },
    });

    if (!member) {
      throw new NotFoundException('会话不存在或您不是会话成员');
    }

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.conversationId = :conversationId', { conversationId });

    if (beforeMessageId) {
      queryBuilder.andWhere('message.id < :beforeMessageId', { beforeMessageId });
    }

    const [messages, total] = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .take(limit)
      .getManyAndCount();

    const data: MessageResponseDto[] = messages.reverse().map(message => ({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.username,
      senderAvatar: message.sender.email,
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      mediaSize: message.mediaSize,
      mediaDuration: message.mediaDuration,
      replyToMessageId: message.replyToMessageId,
      status: message.status,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));

    return {
      data,
      total,
      page,
      limit,
      hasMore: messages.length === limit,
    };
  }

  /**
   * 发送消息
   */
  async sendMessage(sendMessageDto: SendMessageDto, userId: number): Promise<MessageResponseDto> {
    const { conversationId, type, content, mediaUrl, mediaSize, mediaDuration, replyToMessageId } = sendMessageDto;

    this.logger.log(`用户 ${userId} 向会话 ${conversationId} 发送消息`);

    // 验证用户是否是会话成员
    const member = await this.conversationMemberRepository.findOne({
      where: { conversationId, userId },
    });

    if (!member) {
      throw new BadRequestException('您不是该会话的成员');
    }

    // 创建消息
    const message = this.messageRepository.create({
      conversationId,
      senderId: userId,
      type,
      content,
      mediaUrl,
      mediaSize,
      mediaDuration,
      replyToMessageId,
      status: 'sent',
    });

    const savedMessage = await this.messageRepository.save(message);

    // 获取发送者信息
    const sender = await this.userRepository.findOne({ where: { id: userId } });

    return {
      id: savedMessage.id,
      conversationId: savedMessage.conversationId,
      senderId: savedMessage.senderId,
      senderName: sender.username,
      senderAvatar: sender.email,
      type: savedMessage.type,
      content: savedMessage.content,
      mediaUrl: savedMessage.mediaUrl,
      mediaSize: savedMessage.mediaSize,
      mediaDuration: savedMessage.mediaDuration,
      replyToMessageId: savedMessage.replyToMessageId,
      status: savedMessage.status,
      createdAt: savedMessage.createdAt,
      updatedAt: savedMessage.updatedAt,
    };
  }

  /**
   * 创建会话
   */
  async createConversation(createDto: CreateConversationDto, userId: number): Promise<ConversationResponseDto> {
    const { type, name, avatar, memberIds } = createDto;

    this.logger.log(`用户 ${userId} 创建${type === 'group' ? '群聊' : '私聊'}会话`);

    // 验证成员是否存在
    const users = await this.userRepository.find({
      where: { id: In([userId, ...memberIds]) },
    });

    if (users.length !== memberIds.length + 1) {
      throw new BadRequestException('部分用户不存在');
    }

    // 对于私聊，检查是否已存在会话
    if (type === 'private' && memberIds.length === 1) {
      const existingConversation = await this.findPrivateConversation(userId, memberIds[0]);
      if (existingConversation) {
        return this.getConversationDetail(existingConversation.id, userId);
      }
    }

    // 创建会话
    const conversation = this.conversationRepository.create({
      type,
      name,
      avatar,
      creatorId: userId,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // 添加成员
    const members = [userId, ...memberIds].map((memberId, index) => {
      return this.conversationMemberRepository.create({
        conversationId: savedConversation.id,
        userId: memberId,
        role: memberId === userId ? 'owner' : 'member',
      });
    });

    await this.conversationMemberRepository.save(members);

    return this.getConversationDetail(savedConversation.id, userId);
  }

  /**
   * 标记消息已读
   */
  async markAsRead(markReadDto: MarkReadDto, userId: number): Promise<void> {
    const { conversationId, messageId } = markReadDto;

    this.logger.log(`用户 ${userId} 标记会话 ${conversationId} 的消息 ${messageId} 为已读`);

    await this.conversationMemberRepository.update(
      { conversationId, userId },
      { lastReadMessageId: messageId },
    );
  }

  /**
   * 查找私聊会话
   */
  private async findPrivateConversation(userId1: number, userId2: number): Promise<Conversation | null> {
    const conversations = await this.conversationMemberRepository
      .createQueryBuilder('member1')
      .innerJoin(
        ConversationMember,
        'member2',
        'member1.conversationId = member2.conversationId AND member2.userId = :userId2',
        { userId2 },
      )
      .innerJoin('member1.conversation', 'conversation')
      .where('member1.userId = :userId1', { userId1 })
      .andWhere('conversation.type = :type', { type: 'private' })
      .select('conversation')
      .getRawMany();

    return conversations.length > 0 ? conversations[0] : null;
  }
}
