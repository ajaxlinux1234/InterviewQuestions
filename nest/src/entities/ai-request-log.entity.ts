import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('ai_request_logs')
@Index(['userId', 'createdAt'])
@Index(['status'])
@Index(['model'])
export class AiRequestLog {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  response: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount: number;

  @Column({ type: 'int', nullable: true, comment: 'Duration in milliseconds' })
  duration: number;

  @Column({ 
    type: 'enum', 
    enum: ['success', 'error', 'cancelled', 'timeout'], 
    default: 'success' 
  })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'conversation_id', type: 'bigint', nullable: true })
  conversationId: number;

  @Column({ name: 'prompt_message_id', type: 'bigint', nullable: true })
  promptMessageId: number;

  @Column({ name: 'response_message_id', type: 'bigint', nullable: true })
  responseMessageId: number;

  @Column({ type: 'json', nullable: true })
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    requestId?: string;
    chunkCount?: number;
    streamDuration?: number;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}