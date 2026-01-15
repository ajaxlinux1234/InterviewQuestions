/**
 * AI 服务
 * 
 * 核心业务逻辑服务，处理 AI 对话请求、验证、清理和持久化
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { LlmClient } from './llm-client';
import { AuditLoggerService } from './audit-logger.service';
import { ContentFilterService } from './content-filter.service';
import { Message } from '../../entities/message.entity';

export interface AiStreamChunk {
  type: 'chunk' | 'done' | 'error';
  content: string;
  timestamp: number;
  metadata?: {
    chunkIndex?: number;
    totalChunks?: number;
  };
}

export interface AiConversationResult {
  promptMessageId: number;
  responseMessageId: number;
  totalTokens?: number;
  duration: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly maxPromptLength: number;
  private readonly requestCache = new Map<string, number>(); // 用于去重

  constructor(
    private readonly llmClient: LlmClient,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly configService: ConfigService,
    private readonly auditLogger: AuditLoggerService,
    private readonly contentFilter: ContentFilterService,
  ) {
    this.maxPromptLength = this.configService.get<number>('AI_MAX_PROMPT_LENGTH', 2000);
  }

  /**
   * 生成流式响应
   * 
   * @param userId 用户 ID
   * @param prompt 用户提示词
   * @param conversationId 会话 ID（可选）
   * @returns AsyncGenerator<AiStreamChunk> 流式响应块
   */
  async *streamResponse(
    userId: number,
    prompt: string,
    conversationId?: number,
  ): AsyncGenerator<AiStreamChunk> {
    const startTime = Date.now();
    let chunkIndex = 0;
    let fullResponse = '';
    let promptMessageId: number | null = null;
    let logId: number | null = null;

    try {
      // 验证和清理提示词
      const cleanPrompt = this.validateAndSanitizePrompt(prompt);
      this.logger.debug(`Processing AI request for user ${userId}, prompt length: ${cleanPrompt.length}`);

      // 检查重复请求
      this.checkDuplicateRequest(userId, cleanPrompt);

      // 创建审计日志记录
      const logEntry = await this.auditLogger.createLogEntry(
        userId,
        cleanPrompt,
        this.configService.get<string>('GROQ_MODEL'),
        conversationId,
      );
      logId = logEntry?.id;

      // 保存用户提示消息
      promptMessageId = await this.savePromptMessage(userId, cleanPrompt, conversationId);

      // 生成流式响应
      const stream = this.llmClient.generateStream(cleanPrompt);

      for await (const chunk of stream) {
        chunkIndex++;
        fullResponse += chunk.content;

        yield {
          type: 'chunk',
          content: chunk.content,
          timestamp: chunk.timestamp,
          metadata: {
            chunkIndex,
          },
        };
      }

      // 保存完整的 AI 响应
      const responseMessageId = await this.saveResponseMessage(
        userId,
        fullResponse,
        conversationId,
        promptMessageId,
      );

      // 更新审计日志
      const duration = Date.now() - startTime;
      if (logId) {
        await this.auditLogger.updateLogEntry(logId, {
          response: fullResponse,
          duration,
          status: 'success',
          promptMessageId,
          responseMessageId,
          metadata: {
            chunkCount: chunkIndex,
            responseLength: fullResponse.length,
          },
        });
      }

      // 发送完成信号
      yield {
        type: 'done',
        content: '',
        timestamp: Date.now(),
        metadata: {
          totalChunks: chunkIndex,
        },
      };

      const totalDuration = Date.now() - startTime;
      this.logger.log(
        `AI response completed for user ${userId}: ${chunkIndex} chunks, ${fullResponse.length} chars, ${totalDuration}ms`,
      );

      // 清理请求缓存
      this.clearRequestCache(userId, cleanPrompt);

    } catch (error) {
      this.logger.error(`AI stream generation failed for user ${userId}: ${error.message}`, error.stack);

      // 更新审计日志为错误状态
      const duration = Date.now() - startTime;
      if (logId) {
        await this.auditLogger.updateLogEntry(logId, {
          duration,
          status: 'error',
          errorMessage: error.message,
          response: fullResponse || null,
        });
      }

      // 发送错误信号
      yield {
        type: 'error',
        content: this.getUserFriendlyErrorMessage(error),
        timestamp: Date.now(),
      };

      // 清理请求缓存
      if (promptMessageId) {
        this.clearRequestCache(userId, prompt);
      }

      throw error;
    }
  }

  /**
   * 验证和清理提示词
   * 
   * @param prompt 原始提示词
   * @returns 清理后的提示词
   */
  validateAndSanitizePrompt(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') {
      throw new BadRequestException('Prompt is required and must be a string');
    }

    // 去除首尾空白
    const trimmed = prompt.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Prompt cannot be empty or contain only whitespace');
    }

    if (trimmed.length > this.maxPromptLength) {
      throw new BadRequestException(
        `Prompt is too long. Maximum length is ${this.maxPromptLength} characters, got ${trimmed.length}`,
      );
    }

    // 内容过滤检查
    const filterResult = this.contentFilter.checkContent(trimmed);
    if (!filterResult.isAllowed) {
      this.logger.warn(
        `Content filter blocked prompt: ${filterResult.reason}, matched keywords: ${filterResult.matchedKeywords?.join(', ')}`,
      );
      throw new BadRequestException(
        filterResult.reason || 'Content contains inappropriate or malicious content',
      );
    }

    // 清理内容（移除潜在的恶意内容）
    let sanitized = this.contentFilter.sanitizeContent(trimmed);

    // 移除控制字符（保留换行和制表符）
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // 限制连续的换行符
    sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

    this.logger.debug(`Prompt sanitized: ${prompt.length} -> ${sanitized.length} chars`);

    return sanitized;
  }

  /**
   * 保存用户提示消息
   * 
   * @param userId 用户 ID
   * @param prompt 提示词
   * @param conversationId 会话 ID
   * @returns Promise<number> 消息 ID
   */
  private async savePromptMessage(
    userId: number,
    prompt: string,
    conversationId?: number,
  ): Promise<number> {
    try {
      const message = this.messageRepository.create({
        senderId: userId,
        conversationId: conversationId || null,
        content: prompt,
        type: 'ai_prompt',
        metadata: {
          model: this.configService.get<string>('GROQ_MODEL'),
          timestamp: Date.now(),
        },
      });

      const savedMessage = await this.messageRepository.save(message);
      this.logger.debug(`Prompt message saved with ID: ${savedMessage.id}`);

      return savedMessage.id;
    } catch (error) {
      this.logger.error(`Failed to save prompt message: ${error.message}`, error.stack);
      throw new Error('Failed to save prompt message');
    }
  }

  /**
   * 保存 AI 响应消息
   * 
   * @param userId 用户 ID
   * @param response AI 响应内容
   * @param conversationId 会话 ID
   * @param promptMessageId 关联的提示消息 ID
   * @returns Promise<number> 消息 ID
   */
  private async saveResponseMessage(
    userId: number,
    response: string,
    conversationId: number | undefined,
    promptMessageId: number,
  ): Promise<number> {
    try {
      const message = this.messageRepository.create({
        senderId: null, // AI 消息没有发送者
        conversationId: conversationId || null,
        content: response,
        type: 'ai_response',
        aiPromptId: promptMessageId,
        metadata: {
          model: this.configService.get<string>('GROQ_MODEL'),
          responseLength: response.length,
          timestamp: Date.now(),
        },
      });

      const savedMessage = await this.messageRepository.save(message);
      this.logger.debug(`Response message saved with ID: ${savedMessage.id}`);

      return savedMessage.id;
    } catch (error) {
      this.logger.error(`Failed to save response message: ${error.message}`, error.stack);
      throw new Error('Failed to save response message');
    }
  }

  /**
   * 保存完整对话
   * 
   * @param userId 用户 ID
   * @param prompt 用户提示词
   * @param response AI 响应
   * @param conversationId 会话 ID（可选）
   * @returns Promise<AiConversationResult> 保存结果
   */
  async saveConversation(
    userId: number,
    prompt: string,
    response: string,
    conversationId?: number,
  ): Promise<AiConversationResult> {
    const startTime = Date.now();

    try {
      // 验证输入
      const cleanPrompt = this.validateAndSanitizePrompt(prompt);

      // 保存提示消息
      const promptMessageId = await this.savePromptMessage(userId, cleanPrompt, conversationId);

      // 保存响应消息
      const responseMessageId = await this.saveResponseMessage(
        userId,
        response,
        conversationId,
        promptMessageId,
      );

      const duration = Date.now() - startTime;

      this.logger.log(
        `Conversation saved for user ${userId}: prompt=${promptMessageId}, response=${responseMessageId}, duration=${duration}ms`,
      );

      return {
        promptMessageId,
        responseMessageId,
        duration,
      };
    } catch (error) {
      this.logger.error(`Failed to save conversation for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 检查重复请求
   * 
   * @param userId 用户 ID
   * @param prompt 提示词
   */
  private checkDuplicateRequest(userId: number, prompt: string): void {
    const cacheKey = `${userId}:${this.hashPrompt(prompt)}`;
    const now = Date.now();
    const windowMs = this.configService.get<number>('AI_RATE_LIMIT_WINDOW', 60000);

    if (this.requestCache.has(cacheKey)) {
      const lastRequestTime = this.requestCache.get(cacheKey)!;
      if (now - lastRequestTime < 5000) { // 5秒内的重复请求
        throw new BadRequestException('Duplicate request detected. Please wait before sending the same prompt again.');
      }
    }

    // 记录请求时间
    this.requestCache.set(cacheKey, now);

    // 清理过期的缓存条目
    this.cleanupRequestCache(windowMs);
  }

  /**
   * 清理请求缓存
   * 
   * @param userId 用户 ID
   * @param prompt 提示词
   */
  private clearRequestCache(userId: number, prompt: string): void {
    const cacheKey = `${userId}:${this.hashPrompt(prompt)}`;
    this.requestCache.delete(cacheKey);
  }

  /**
   * 清理过期的请求缓存
   * 
   * @param windowMs 时间窗口（毫秒）
   */
  private cleanupRequestCache(windowMs: number): void {
    const now = Date.now();
    for (const [key, timestamp] of this.requestCache.entries()) {
      if (now - timestamp > windowMs) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * 生成提示词哈希（用于去重）
   * 
   * @param prompt 提示词
   * @returns 哈希值
   */
  private hashPrompt(prompt: string): string {
    // 简单的哈希函数，用于去重
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      const char = prompt.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(36);
  }

  /**
   * 获取用户友好的错误消息
   * 
   * @param error 原始错误
   * @returns 用户友好的错误消息
   */
  private getUserFriendlyErrorMessage(error: any): string {
    if (error instanceof BadRequestException) {
      return error.message;
    }

    if (error.message?.includes('403')) {
      return 'AI service is temporarily unavailable. Please check your API key configuration.';
    }

    if (error.message?.includes('timeout')) {
      return 'AI service request timed out. Please try again.';
    }

    if (error.message?.includes('rate limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    if (error.message?.includes('network') || error.message?.includes('connection')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    // 默认错误消息
    return 'AI service is temporarily unavailable. Please try again later.';
  }

  /**
   * 获取服务状态
   * 
   * @returns 服务状态信息
   */
  async getServiceStatus(): Promise<{
    isHealthy: boolean;
    modelInfo: any;
    hasApiKey: boolean;
    cacheSize: number;
  }> {
    try {
      const isHealthy = await this.llmClient.validateConnection();
      const modelInfo = this.llmClient.getModelInfo();
      const hasApiKey = this.llmClient.hasApiKey();
      const cacheSize = this.requestCache.size;

      return {
        isHealthy,
        modelInfo,
        hasApiKey,
        cacheSize,
      };
    } catch (error) {
      this.logger.error(`Failed to get service status: ${error.message}`);
      return {
        isHealthy: false,
        modelInfo: null,
        hasApiKey: false,
        cacheSize: this.requestCache.size,
      };
    }
  }
}