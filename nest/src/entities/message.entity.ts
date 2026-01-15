import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'conversation_id', type: 'bigint', nullable: true })
  conversationId: number;

  @Column({ name: 'sender_id', type: 'bigint', nullable: true })
  senderId: number;

  @Column({ type: 'enum', enum: ['text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response'] })
  type: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'media_url', type: 'varchar', length: 500, nullable: true })
  mediaUrl: string;

  @Column({ name: 'media_size', type: 'int', nullable: true })
  mediaSize: number;

  @Column({ name: 'media_duration', type: 'int', nullable: true })
  mediaDuration: number;

  @Column({ name: 'reply_to_message_id', type: 'bigint', nullable: true })
  replyToMessageId: number;

  @Column({ name: 'ai_prompt_id', type: 'bigint', nullable: true })
  aiPromptId: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    model?: string;
    tokenCount?: number;
    streamDuration?: number;
    responseLength?: number;
    timestamp?: number;
    [key: string]: any;
  };

  @Column({ type: 'enum', enum: ['sending', 'sent', 'delivered', 'read', 'failed'], default: 'sent' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}
