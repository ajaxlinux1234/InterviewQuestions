/**
 * AI 会话实体
 * 
 * 用于管理用户与 AI 助手的对话会话
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Message } from './message.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', name: 'user_id', comment: '用户 ID' })
  userId: number;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '会话标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '会话摘要' })
  summary: string;

  @Column({ type: 'int', name: 'message_count', default: 0, comment: '消息数量' })
  messageCount: number;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'active', 
    comment: '会话状态: active, archived, deleted' 
  })
  status: 'active' | 'archived' | 'deleted';

  @Column({ type: 'json', nullable: true, comment: '会话元数据' })
  metadata: {
    model?: string;
    lastPrompt?: string;
    tags?: string[];
  };

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 关联消息（一个会话有多条消息）
  @OneToMany(() => Message, message => message.aiConversation)
  messages: Message[];
}
