/**
 * AI 审计日志服务
 * 
 * 记录所有 AI 请求用于审计和监控
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiRequestLog } from '../../entities/ai-request-log.entity';

export interface AiRequestLogData {
  userId: number;
  prompt: string;
  response?: string;
  model: string;
  tokenCount?: number;
  duration?: number;
  status: 'success' | 'error' | 'cancelled' | 'timeout';
  errorMessage?: string;
  conversationId?: number;
  promptMessageId?: number;
  responseMessageId?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLoggerService {
  private readonly logger = new Logger(AuditLoggerService.name);

  constructor(
    @InjectRepository(AiRequestLog)
    private readonly aiRequestLogRepository: Repository<AiRequestLog>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 记录 AI 请求
   * 
   * @param data 请求日志数据
   * @returns Promise<AiRequestLog> 保存的日志记录
   */
  async logAiRequest(data: AiRequestLogData): Promise<AiRequestLog> {
    try {
      const log = this.aiRequestLogRepository.create({
        userId: data.userId,
        prompt: data.prompt,
        response: data.response,
        model: data.model,
        tokenCount: data.tokenCount,
        duration: data.duration,
        status: data.status,
        errorMessage: data.errorMessage,
        conversationId: data.conversationId,
        promptMessageId: data.promptMessageId,
        responseMessageId: data.responseMessageId,
        metadata: data.metadata,
      });

      const savedLog = await this.aiRequestLogRepository.save(log);
      
      this.logger.debug(
        `AI request logged: id=${savedLog.id}, user=${data.userId}, status=${data.status}, duration=${data.duration}ms`,
      );

      return savedLog;
    } catch (error) {
      this.logger.error(`Failed to log AI request: ${error.message}`, error.stack);
      // 不抛出错误，避免影响主流程
      return null;
    }
  }

  /**
   * 创建日志记录（不立即保存）
   * 
   * @param userId 用户 ID
   * @param prompt 提示词
   * @param model 模型名称
   * @param conversationId 会话 ID（可选）
   * @returns Promise<AiRequestLog> 未保存的日志记录
   */
  async createLogEntry(
    userId: number,
    prompt: string,
    model: string,
    conversationId?: number,
  ): Promise<AiRequestLog> {
    try {
      const log = this.aiRequestLogRepository.create({
        userId,
        prompt,
        model,
        conversationId,
        status: 'success', // 默认状态
      });

      const savedLog = await this.aiRequestLogRepository.save(log);
      this.logger.debug(`AI request log entry created: id=${savedLog.id}`);
      
      return savedLog;
    } catch (error) {
      this.logger.error(`Failed to create log entry: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 更新日志记录
   * 
   * @param logId 日志 ID
   * @param updates 更新数据
   * @returns Promise<boolean> 是否更新成功
   */
  async updateLogEntry(
    logId: number,
    updates: Partial<AiRequestLogData>,
  ): Promise<boolean> {
    try {
      await this.aiRequestLogRepository.update(logId, updates);
      this.logger.debug(`AI request log updated: id=${logId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update log entry: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 获取用户的请求历史
   * 
   * @param userId 用户 ID
   * @param limit 返回数量限制
   * @returns Promise<AiRequestLog[]> 请求历史
   */
  async getUserRequestHistory(userId: number, limit: number = 50): Promise<AiRequestLog[]> {
    try {
      return await this.aiRequestLogRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get user request history: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 获取请求统计
   * 
   * @param userId 用户 ID（可选，不提供则返回全局统计）
   * @param startDate 开始日期（可选）
   * @param endDate 结束日期（可选）
   * @returns Promise<any> 统计数据
   */
  async getRequestStatistics(
    userId?: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageDuration: number;
    totalTokens: number;
  }> {
    try {
      const queryBuilder = this.aiRequestLogRepository.createQueryBuilder('log');

      if (userId) {
        queryBuilder.where('log.userId = :userId', { userId });
      }

      if (startDate) {
        queryBuilder.andWhere('log.createdAt >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('log.createdAt <= :endDate', { endDate });
      }

      const [totalRequests, successfulRequests, failedRequests] = await Promise.all([
        queryBuilder.getCount(),
        queryBuilder.clone().andWhere('log.status = :status', { status: 'success' }).getCount(),
        queryBuilder.clone().andWhere('log.status != :status', { status: 'success' }).getCount(),
      ]);

      const avgResult = await queryBuilder
        .select('AVG(log.duration)', 'avgDuration')
        .addSelect('SUM(log.tokenCount)', 'totalTokens')
        .getRawOne();

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageDuration: Math.round(avgResult?.avgDuration || 0),
        totalTokens: parseInt(avgResult?.totalTokens || '0', 10),
      };
    } catch (error) {
      this.logger.error(`Failed to get request statistics: ${error.message}`, error.stack);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        totalTokens: 0,
      };
    }
  }

  /**
   * 清理旧的日志记录
   * 
   * @param daysToKeep 保留天数
   * @returns Promise<number> 删除的记录数
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.aiRequestLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;
      this.logger.log(`Cleaned up ${deletedCount} old AI request logs (older than ${daysToKeep} days)`);

      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to cleanup old logs: ${error.message}`, error.stack);
      return 0;
    }
  }

  /**
   * 获取模型使用统计
   * 
   * @returns Promise<any[]> 模型使用统计
   */
  async getModelUsageStatistics(): Promise<
    Array<{
      model: string;
      requestCount: number;
      successRate: number;
      averageDuration: number;
      totalTokens: number;
    }>
  > {
    try {
      const results = await this.aiRequestLogRepository
        .createQueryBuilder('log')
        .select('log.model', 'model')
        .addSelect('COUNT(*)', 'requestCount')
        .addSelect(
          'ROUND(SUM(CASE WHEN log.status = "success" THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2)',
          'successRate',
        )
        .addSelect('ROUND(AVG(log.duration), 0)', 'averageDuration')
        .addSelect('SUM(log.tokenCount)', 'totalTokens')
        .groupBy('log.model')
        .orderBy('requestCount', 'DESC')
        .getRawMany();

      return results.map((r) => ({
        model: r.model,
        requestCount: parseInt(r.requestCount, 10),
        successRate: parseFloat(r.successRate),
        averageDuration: parseInt(r.averageDuration, 10),
        totalTokens: parseInt(r.totalTokens || '0', 10),
      }));
    } catch (error) {
      this.logger.error(`Failed to get model usage statistics: ${error.message}`, error.stack);
      return [];
    }
  }
}