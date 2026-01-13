/**
 * 用户令牌实体 (user-token.entity.ts)
 * 
 * 这是用户访问令牌的实体类，负责：
 * 1. 存储用户的访问令牌信息
 * 2. 管理令牌的生命周期和状态
 * 3. 记录令牌的使用情况和安全信息
 * 4. 建立与用户实体的关联关系
 * 
 * TypeORM 实体概念：
 * - @Entity(): 标记类为数据库实体
 * - @ManyToOne(): 多对一关系
 * - @JoinColumn(): 指定外键字段
 * - 支持复杂的数据类型和约束
 */

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

/**
 * 用户令牌实体类
 * 
 * @Entity('user_tokens') 装饰器：
 * - 将此类标记为 TypeORM 实体
 * - 'user_tokens' 参数指定对应的数据库表名
 * - 用于存储用户的访问令牌和相关信息
 */
@Entity('user_tokens')
export class UserToken {
  /**
   * 令牌记录 ID - 主键
   * 
   * @PrimaryGeneratedColumn() 装饰器：
   * - 定义自增主键字段
   * - 每个令牌记录都有唯一的 ID
   * - 用于数据库内部索引和关联
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 关联用户 ID - 外键
   * 
   * @Column() 装饰器配置：
   * - type: 'bigint' - 大整数类型，支持更大的用户 ID 范围
   * - 存储关联用户的 ID，建立令牌与用户的关系
   * - 对应数据库字段：user_id BIGINT
   */
  @Column({ type: 'bigint' })
  user_id: number;

  /**
   * 访问令牌字符串 - 唯一索引
   * 
   * @Column() 装饰器配置：
   * - length: 255 - 最大长度 255 字符
   * - unique: true - 唯一约束，确保令牌不重复
   * - 存储实际的令牌字符串（通常是随机生成的十六进制字符串）
   * - 对应数据库字段：token VARCHAR(255) UNIQUE
   */
  @Column({ length: 255, unique: true })
  token: string;

  /**
   * 令牌类型 - 分类标识
   * 
   * @Column() 装饰器配置：
   * - length: 20 - 最大长度 20 字符
   * - default: 'access' - 默认值为 'access'
   * - 用于区分不同类型的令牌（access、refresh、reset 等）
   * - 对应数据库字段：token_type VARCHAR(20) DEFAULT 'access'
   */
  @Column({ length: 20, default: 'access' })
  token_type: string;

  /**
   * 令牌过期时间 - 安全控制
   * 
   * @Column() 装饰器配置：
   * - type: 'timestamp' - 时间戳类型
   * - 存储令牌的过期时间
   * - 用于验证令牌是否仍然有效
   * - 对应数据库字段：expires_at TIMESTAMP
   */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  /**
   * 令牌撤销状态 - 软删除标记
   * 
   * @Column() 装饰器配置：
   * - type: 'tinyint' - 小整数类型（0 或 1）
   * - default: 0 - 默认值为 0（未撤销）
   * - 0: 令牌有效，1: 令牌已撤销
   * - 使用软删除模式，保留令牌记录用于审计
   * - 对应数据库字段：is_revoked TINYINT DEFAULT 0
   */
  @Column({ type: 'tinyint', default: 0 })
  is_revoked: number;

  /**
   * 令牌创建时间 - 自动管理
   * 
   * @CreateDateColumn() 装饰器：
   * - TypeORM 会在创建记录时自动设置此字段
   * - 记录令牌的创建时间
   * - 用于审计和统计分析
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * 令牌最后使用时间 - 活跃度跟踪
   * 
   * @Column() 装饰器配置：
   * - type: 'timestamp' - 时间戳类型
   * - nullable: true - 允许为空
   * - 记录令牌最后一次被使用的时间
   * - 用于用户活跃度分析和安全监控
   * - 对应数据库字段：last_used_at TIMESTAMP NULL
   */
  @Column({ type: 'timestamp', nullable: true })
  last_used_at?: Date;

  /**
   * 用户代理信息 - 设备识别
   * 
   * @Column() 装饰器配置：
   * - length: 500 - 最大长度 500 字符
   * - nullable: true - 允许为空
   * - 存储客户端的 User-Agent 字符串
   * - 用于识别登录设备和浏览器类型
   * - 对应数据库字段：user_agent VARCHAR(500) NULL
   */
  @Column({ length: 500, nullable: true })
  user_agent?: string;

  /**
   * 客户端 IP 地址 - 安全审计
   * 
   * @Column() 装饰器配置：
   * - length: 45 - 最大长度 45 字符（支持 IPv6）
   * - nullable: true - 允许为空
   * - 存储客户端的 IP 地址
   * - 用于安全审计和异常登录检测
   * - 对应数据库字段：ip_address VARCHAR(45) NULL
   */
  @Column({ length: 45, nullable: true })
  ip_address?: string;

  /**
   * 关联用户实体 - 多对一关系
   * 
   * @ManyToOne() 装饰器：
   * - 定义与 User 实体的多对一关系
   * - () => User - 关联的实体类
   * - user => user.tokens - 反向关系的属性
   * - { onDelete: 'CASCADE' } - 级联删除，用户删除时删除其所有令牌
   * 
   * @JoinColumn() 装饰器：
   * - { name: 'user_id' } - 指定外键字段名
   * - 建立与 users 表的关联
   */
  @ManyToOne(() => User, user => user.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

/**
 * 实体使用示例：
 * 
 * 1. 创建新令牌：
 * ```typescript
 * const token = tokenRepository.create({
 *   user_id: 1,
 *   token: 'abc123...',
 *   token_type: 'access',
 *   expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
 *   user_agent: 'Mozilla/5.0...',
 *   ip_address: '192.168.1.100'
 * });
 * await tokenRepository.save(token);
 * ```
 * 
 * 2. 查询有效令牌：
 * ```typescript
 * const token = await tokenRepository.findOne({
 *   where: {
 *     token: 'abc123...',
 *     is_revoked: 0
 *   },
 *   relations: ['user']
 * });
 * ```
 * 
 * 3. 撤销令牌：
 * ```typescript
 * await tokenRepository.update(
 *   { token: 'abc123...' },
 *   { is_revoked: 1 }
 * );
 * ```
 * 
 * 4. 清理过期令牌：
 * ```typescript
 * await tokenRepository.update(
 *   { expires_at: LessThan(new Date()) },
 *   { is_revoked: 1 }
 * );
 * ```
 */

/**
 * 数据库表结构对应：
 * 
 * CREATE TABLE user_tokens (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   user_id BIGINT NOT NULL,
 *   token VARCHAR(255) UNIQUE NOT NULL,
 *   token_type VARCHAR(20) DEFAULT 'access',
 *   expires_at TIMESTAMP NOT NULL,
 *   is_revoked TINYINT DEFAULT 0,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   last_used_at TIMESTAMP NULL,
 *   user_agent VARCHAR(500) NULL,
 *   ip_address VARCHAR(45) NULL,
 *   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
 *   INDEX idx_token (token),
 *   INDEX idx_user_id (user_id),
 *   INDEX idx_expires_at (expires_at)
 * );
 */

/**
 * 令牌管理策略：
 * 
 * 1. 安全性：
 *    - 令牌唯一性保证
 *    - 过期时间控制
 *    - IP 和设备信息记录
 *    - 软删除保留审计记录
 * 
 * 2. 性能优化：
 *    - 令牌字段建立索引
 *    - 用户 ID 字段建立索引
 *    - 过期时间字段建立索引
 * 
 * 3. 用户体验：
 *    - 支持多设备同时登录
 *    - 30天长期有效期
 *    - 自动更新使用时间
 * 
 * 4. 维护性：
 *    - 定期清理过期令牌
 *    - 监控异常登录行为
 *    - 统计用户活跃度
 */