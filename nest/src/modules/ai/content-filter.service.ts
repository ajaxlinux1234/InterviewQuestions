/**
 * 内容过滤服务
 * 
 * 检测和过滤不当内容
 */

import { Injectable, Logger } from '@nestjs/common';

export interface FilterResult {
  isAllowed: boolean;
  reason?: string;
  matchedKeywords?: string[];
  severity?: 'low' | 'medium' | 'high';
}

@Injectable()
export class ContentFilterService {
  private readonly logger = new Logger(ContentFilterService.name);

  // 不当内容关键词列表（示例，实际应该更完善）
  private readonly blockedKeywords: string[] = [
    // 暴力相关
    '杀人', '自杀', '伤害',
    // 色情相关
    '色情', '裸体',
    // 仇恨言论
    '种族歧视', '性别歧视',
    // 非法活动
    '毒品', '走私', '诈骗',
  ];

  // 敏感关键词列表（警告但不阻止）
  private readonly sensitiveKeywords: string[] = [
    '政治', '宗教', '赌博',
  ];

  // 恶意模式（正则表达式）
  private readonly maliciousPatterns: RegExp[] = [
    /(\w)\1{20,}/i, // 重复字符攻击
    /<script[^>]*>.*?<\/script>/gi, // XSS 攻击
    /javascript:/gi, // JavaScript 协议
    /on\w+\s*=/gi, // 事件处理器
  ];

  /**
   * 检查内容是否包含不当内容
   * 
   * @param content 要检查的内容
   * @returns FilterResult 过滤结果
   */
  checkContent(content: string): FilterResult {
    if (!content || typeof content !== 'string') {
      return {
        isAllowed: false,
        reason: 'Invalid content',
      };
    }

    // 检查恶意模式
    const maliciousCheck = this.checkMaliciousPatterns(content);
    if (!maliciousCheck.isAllowed) {
      return maliciousCheck;
    }

    // 检查被禁止的关键词
    const blockedCheck = this.checkBlockedKeywords(content);
    if (!blockedCheck.isAllowed) {
      return blockedCheck;
    }

    // 检查敏感关键词（仅记录，不阻止）
    const sensitiveCheck = this.checkSensitiveKeywords(content);
    if (sensitiveCheck.matchedKeywords && sensitiveCheck.matchedKeywords.length > 0) {
      this.logger.warn(
        `Sensitive keywords detected: ${sensitiveCheck.matchedKeywords.join(', ')}`,
      );
    }

    return {
      isAllowed: true,
    };
  }

  /**
   * 检查恶意模式
   * 
   * @param content 内容
   * @returns FilterResult 检查结果
   */
  private checkMaliciousPatterns(content: string): FilterResult {
    for (const pattern of this.maliciousPatterns) {
      if (pattern.test(content)) {
        this.logger.warn(`Malicious pattern detected: ${pattern.source}`);
        return {
          isAllowed: false,
          reason: 'Content contains malicious patterns',
          severity: 'high',
        };
      }
    }

    return { isAllowed: true };
  }

  /**
   * 检查被禁止的关键词
   * 
   * @param content 内容
   * @returns FilterResult 检查结果
   */
  private checkBlockedKeywords(content: string): FilterResult {
    const lowerContent = content.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const keyword of this.blockedKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    if (matchedKeywords.length > 0) {
      this.logger.warn(`Blocked keywords detected: ${matchedKeywords.join(', ')}`);
      return {
        isAllowed: false,
        reason: 'Content contains inappropriate keywords',
        matchedKeywords,
        severity: 'high',
      };
    }

    return { isAllowed: true };
  }

  /**
   * 检查敏感关键词
   * 
   * @param content 内容
   * @returns FilterResult 检查结果
   */
  private checkSensitiveKeywords(content: string): FilterResult {
    const lowerContent = content.toLowerCase();
    const matchedKeywords: string[] = [];

    for (const keyword of this.sensitiveKeywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    return {
      isAllowed: true,
      matchedKeywords,
      severity: matchedKeywords.length > 0 ? 'medium' : undefined,
    };
  }

  /**
   * 清理内容（移除潜在的恶意内容）
   * 
   * @param content 原始内容
   * @returns 清理后的内容
   */
  sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    let sanitized = content;

    // 移除 HTML 标签
    sanitized = sanitized.replace(/<[^>]*>/g, '');

    // 移除 JavaScript 协议
    sanitized = sanitized.replace(/javascript:/gi, '');

    // 移除事件处理器
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // 限制重复字符
    sanitized = sanitized.replace(/(.)\1{10,}/g, '$1$1$1');

    return sanitized;
  }

  /**
   * 添加自定义被禁止的关键词
   * 
   * @param keywords 关键词列表
   */
  addBlockedKeywords(keywords: string[]): void {
    this.blockedKeywords.push(...keywords);
    this.logger.log(`Added ${keywords.length} blocked keywords`);
  }

  /**
   * 添加自定义敏感关键词
   * 
   * @param keywords 关键词列表
   */
  addSensitiveKeywords(keywords: string[]): void {
    this.sensitiveKeywords.push(...keywords);
    this.logger.log(`Added ${keywords.length} sensitive keywords`);
  }

  /**
   * 获取过滤统计
   * 
   * @returns 过滤统计信息
   */
  getFilterStatistics(): {
    blockedKeywordsCount: number;
    sensitiveKeywordsCount: number;
    maliciousPatternsCount: number;
  } {
    return {
      blockedKeywordsCount: this.blockedKeywords.length,
      sensitiveKeywordsCount: this.sensitiveKeywords.length,
      maliciousPatternsCount: this.maliciousPatterns.length,
    };
  }
}