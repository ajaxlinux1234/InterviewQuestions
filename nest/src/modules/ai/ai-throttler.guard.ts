/**
 * AI 专用速率限制守卫
 * 
 * 为 AI 端点提供自定义的速率限制逻辑
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: any,
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * 获取速率限制配置
   * 
   * @param req 请求对象
   * @returns 追踪器标识
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 基于用户 ID 进行限制
    const userId = req.user?.id;
    if (userId) {
      return `ai_user_${userId}`;
    }
    
    // 如果没有用户 ID，使用 IP 地址
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * 自定义错误消息
   * 
   * @param context 执行上下文
   * @param throttlerLimitDetail 限制详情
   * @returns 自定义异常
   */
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: any,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    
    const message = userId 
      ? 'Too many AI requests. Please wait before sending another request.'
      : 'Rate limit exceeded. Please authenticate and try again.';

    throw new ThrottlerException(message);
  }
}