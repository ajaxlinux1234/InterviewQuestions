/**
 * AI 控制器
 * 
 * 处理 AI 相关的 HTTP 请求，包括 SSE 流式响应
 */

import {
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  RequestTimeoutException,
  Logger,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, fromEvent, map, catchError, of, finalize, timeout, TimeoutError } from 'rxjs';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '../../auth/auth.guard';
import { AiThrottlerGuard } from './ai-throttler.guard';
import { AiService, AiStreamChunk } from './ai.service';

@Controller('ai')
@UseGuards(AuthGuard, AiThrottlerGuard)
export class AiController {
  private readonly logger = new Logger(AiController.name);
  private readonly streamTimeout = 30000; // 30秒超时

  constructor(private readonly aiService: AiService) {}

  /**
   * SSE 流式聊天端点
   * 
   * @param prompt 用户提示词
   * @param conversationId 会话 ID（可选）
   * @param req 请求对象（包含用户信息）
   * @returns Observable<MessageEvent> SSE 流
   */
  @Get('chat/stream')
  @Sse()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 请求/分钟
  async streamChat(
    @Query('prompt') prompt: string,
    @Query('conversationId') conversationId?: string,
    @Request() req?: any,
  ): Promise<Observable<MessageEvent>> {
    const userId = req?.user?.id;
    const requestId = this.generateRequestId();

    this.logger.log(`SSE stream request: user=${userId}, requestId=${requestId}`);

    // 验证用户身份
    if (!userId) {
      this.logger.warn(`Unauthorized stream request: requestId=${requestId}`);
      throw new UnauthorizedException('User authentication required');
    }

    // 验证提示词
    if (!prompt || typeof prompt !== 'string') {
      this.logger.warn(`Invalid prompt: user=${userId}, requestId=${requestId}`);
      throw new BadRequestException('Prompt parameter is required');
    }

    const parsedConversationId = conversationId ? parseInt(conversationId, 10) : undefined;
    if (conversationId && isNaN(parsedConversationId!)) {
      this.logger.warn(`Invalid conversationId: user=${userId}, requestId=${requestId}`);
      throw new BadRequestException('Invalid conversationId parameter');
    }

    try {
      // 创建异步生成器的 Observable
      return new Observable<MessageEvent>((subscriber) => {
        let streamStartTime = Date.now();
        let lastChunkTime = Date.now();
        let isCompleted = false;

        const processStream = async () => {
          try {
            this.logger.debug(`Starting stream for user ${userId}, requestId=${requestId}`);

            // 发送开始事件
            subscriber.next({
              data: JSON.stringify({
                type: 'start',
                content: '',
                requestId,
                timestamp: Date.now(),
              }),
            } as MessageEvent);

            // 处理流式响应
            const stream = this.aiService.streamResponse(userId, prompt, parsedConversationId);

            for await (const chunk of stream) {
              // 检查超时
              const now = Date.now();
              if (now - streamStartTime > this.streamTimeout) {
                this.logger.warn(`Stream timeout for user ${userId}, requestId=${requestId}`);
                throw new RequestTimeoutException('Stream processing timeout');
              }

              lastChunkTime = now;

              const messageEvent: MessageEvent = {
                data: JSON.stringify({
                  type: chunk.type,
                  content: chunk.content,
                  timestamp: chunk.timestamp,
                  metadata: chunk.metadata,
                  requestId,
                }),
              };

              subscriber.next(messageEvent);

              // 如果是完成或错误，结束流
              if (chunk.type === 'done' || chunk.type === 'error') {
                isCompleted = true;
                break;
              }
            }

            this.logger.debug(`Stream completed for user ${userId}, requestId=${requestId}`);
            subscriber.complete();

          } catch (error) {
            this.logger.error(
              `Stream error for user ${userId}, requestId=${requestId}: ${error.message}`,
              error.stack,
            );

            // 发送错误事件
            if (!isCompleted) {
              subscriber.next({
                data: JSON.stringify({
                  type: 'error',
                  content: this.getClientErrorMessage(error),
                  timestamp: Date.now(),
                  requestId,
                }),
              } as MessageEvent);
            }

            subscriber.error(error);
          }
        };

        // 启动异步处理
        processStream();

        // 清理函数
        return () => {
          this.logger.debug(`Stream cleanup for user ${userId}, requestId=${requestId}`);
        };
      }).pipe(
        catchError((error) => {
          this.logger.error(`Observable error: ${error.message}`, error.stack);
          
          // 处理不同类型的错误
          let errorMessage = 'Internal server error';
          if (error instanceof BadRequestException) {
            errorMessage = error.message;
          } else if (error instanceof UnauthorizedException) {
            errorMessage = 'Authentication required';
          } else if (error instanceof RequestTimeoutException) {
            errorMessage = 'Request timeout - please try again';
          }

          return of({
            data: JSON.stringify({
              type: 'error',
              content: errorMessage,
              timestamp: Date.now(),
              requestId,
            }),
          } as MessageEvent);
        }),
        finalize(() => {
          this.logger.debug(`Stream finalized for user ${userId}, requestId=${requestId}`);
        }),
      );

    } catch (error) {
      this.logger.error(`Failed to create stream: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create AI stream');
    }
  }

  /**
   * 获取 AI 服务状态
   * 
   * @returns 服务状态信息
   */
  @Get('status')
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 请求/分钟
  async getStatus() {
    try {
      const status = await this.aiService.getServiceStatus();
      return {
        success: true,
        data: status,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error(`Failed to get AI service status: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get service status');
    }
  }

  /**
   * 测试 AI 连接
   * 
   * @returns 连接测试结果
   */
  @Post('test')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 请求/分钟
  async testConnection(@Request() req: any) {
    const userId = req?.user?.id;

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    try {
      this.logger.log(`AI connection test requested by user ${userId}`);

      const testPrompt = 'Hello, please respond with "Connection test successful" if you can hear me.';
      const chunks: AiStreamChunk[] = [];

      // 收集所有流块
      const stream = this.aiService.streamResponse(userId, testPrompt);
      for await (const chunk of stream) {
        chunks.push(chunk);
        if (chunk.type === 'done' || chunk.type === 'error') {
          break;
        }
      }

      const responseChunks = chunks.filter(c => c.type === 'chunk');
      const fullResponse = responseChunks.map(c => c.content).join('');

      return {
        success: true,
        data: {
          prompt: testPrompt,
          response: fullResponse,
          chunkCount: responseChunks.length,
          totalDuration: chunks[chunks.length - 1]?.timestamp - chunks[0]?.timestamp,
        },
        timestamp: Date.now(),
      };

    } catch (error) {
      this.logger.error(`AI connection test failed for user ${userId}: ${error.message}`, error.stack);
      return {
        success: false,
        error: this.getClientErrorMessage(error),
        timestamp: Date.now(),
      };
    }
  }

  /**
   * 生成请求 ID
   * 
   * @returns 唯一请求 ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取客户端友好的错误消息
   * 
   * @param error 原始错误
   * @returns 客户端错误消息
   */
  private getClientErrorMessage(error: any): string {
    if (error instanceof BadRequestException) {
      return error.message;
    }

    if (error instanceof UnauthorizedException) {
      return 'Authentication required';
    }

    if (error instanceof RequestTimeoutException) {
      return 'Request timeout - please try again';
    }

    // 不向客户端暴露内部错误详情
    if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      return 'AI service is temporarily unavailable. Please check your API configuration.';
    }

    if (error.message?.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }

    if (error.message?.includes('rate limit')) {
      return 'Too many requests. Please wait before trying again.';
    }

    if (error.message?.includes('network') || error.message?.includes('connection')) {
      return 'Network connection error. Please check your connection and try again.';
    }

    return 'AI service is temporarily unavailable. Please try again later.';
  }
}