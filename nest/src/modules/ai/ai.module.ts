/**
 * AI 模块
 * 
 * 封装所有 AI 相关功能的 NestJS 模块
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LlmClient } from './llm-client';
import { AiThrottlerGuard } from './ai-throttler.guard';
import { AuditLoggerService } from './audit-logger.service';
import { ContentFilterService } from './content-filter.service';
import { Message } from '../../entities/message.entity';
import { AiRequestLog } from '../../entities/ai-request-log.entity';

@Module({
  imports: [
    // TypeORM 模块，注册需要的实体
    TypeOrmModule.forFeature([Message, AiRequestLog]),
    // 导入 AuthModule 以使用 AuthGuard
    AuthModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    LlmClient,
    AiThrottlerGuard,
    AuditLoggerService,
    ContentFilterService,
  ],
  exports: [AiService, LlmClient, AuditLoggerService, ContentFilterService],
})
export class AiModule {}