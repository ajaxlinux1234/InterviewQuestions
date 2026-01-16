/**
 * 用户实体 (user.entity.ts)
 *
 * 这是用户数据的实体类，负责：
 * 1. 定义用户表的结构和字段
 * 2. 建立与数据库表的映射关系
 * 3. 定义字段的类型、约束和关系
 * 4. 提供 TypeORM 的 ORM 功能
 *
 * TypeORM 实体概念：
 * - @Entity(): 标记类为数据库实体
 * - @Column(): 定义表字段
 * - @PrimaryGeneratedColumn(): 自增主键
 * - @CreateDateColumn(): 自动创建时间
 * - @UpdateDateColumn(): 自动更新时间
 * - @OneToMany(): 一对多关系
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { UserToken } from "./user-token.entity";

/**
 * 用户实体类
 *
 * @Entity('users') 装饰器：
 * - 将此类标记为 TypeORM 实体
 * - 'users' 参数指定对应的数据库表名
 * - TypeORM 会根据此类生成或映射数据库表
 */
@Entity("users")
export class User {
  /**
   * 用户 ID - 主键
   *
   * @PrimaryGeneratedColumn() 装饰器：
   * - 定义自增主键字段
   * - 数据库会自动为新记录生成唯一 ID
   * - 类型为 number，对应数据库的 INT AUTO_INCREMENT
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 用户名 - 唯一索引
   *
   * @Column() 装饰器配置：
   * - length: 100 - 最大长度 100 字符
   * - unique: true - 唯一约束，不允许重复
   * - 对应数据库字段：username VARCHAR(100) UNIQUE
   */
  @Column({ length: 100, unique: true })
  username: string;

  /**
   * 密码哈希 - 存储加密后的密码
   *
   * @Column() 装饰器配置：
   * - length: 255 - 最大长度 255 字符
   * - 注意：前端传来的是 MD5 加密后的密码
   * - 对应数据库字段：password VARCHAR(255)
   */
  @Column({ length: 255 })
  password: string;

  /**
   * 邮箱地址 - 唯一索引
   *
   * @Column() 装饰器配置：
   * - length: 255 - 最大长度 255 字符
   * - unique: true - 唯一约束，不允许重复
   * - 对应数据库字段：email VARCHAR(255) UNIQUE
   */
  @Column({ length: 255, unique: true })
  email: string;

  /**
   * 最后在线时间 - 可选字段
   *
   * @Column() 装饰器配置：
   * - type: 'timestamp' - 时间戳类型
   * - nullable: true - 允许为空
   * - 用于记录用户最后活跃时间
   * - 对应数据库字段：last_seen TIMESTAMP NULL
   */
  @Column({ type: "timestamp", nullable: true })
  last_seen?: Date;

  /**
   * 创建时间 - 自动管理
   *
   * @CreateDateColumn() 装饰器：
   * - TypeORM 会在创建记录时自动设置此字段
   * - 类型为 Date，对应数据库的 TIMESTAMP
   * - 不需要手动设置，插入时自动填充
   */
  @CreateDateColumn()
  created_at: Date;

  /**
   * 更新时间 - 自动管理
   *
   * @UpdateDateColumn() 装饰器：
   * - TypeORM 会在更新记录时自动更新此字段
   * - 类型为 Date，对应数据库的 TIMESTAMP
   * - 不需要手动设置，更新时自动修改
   */
  @UpdateDateColumn()
  updated_at: Date;

  /**
   * 用户令牌关系 - 一对多
   *
   * @OneToMany() 装饰器：
   * - 定义与 UserToken 实体的一对多关系
   * - () => UserToken - 关联的实体类
   * - token => token.user - 反向关系的属性
   * - 一个用户可以有多个令牌（多设备登录）
   *
   * 关系说明：
   * - User.tokens 包含该用户的所有令牌
   * - 可以通过 user.tokens 访问用户的所有登录令牌
   * - 支持多设备同时登录的场景
   */
  @OneToMany(() => UserToken, (token) => token.user)
  tokens: UserToken[];
}

/**
 * 实体使用示例：
 *
 * 1. 创建新用户：
 * ```typescript
 * const user = userRepository.create({
 *   username: 'john_doe',
 *   password: 'hashed_password',
 *   email: 'john@example.com'
 * });
 * await userRepository.save(user);
 * ```
 *
 * 2. 查询用户：
 * ```typescript
 * const user = await userRepository.findOne({
 *   where: { username: 'john_doe' }
 * });
 * ```
 *
 * 3. 查询用户及其令牌：
 * ```typescript
 * const user = await userRepository.findOne({
 *   where: { id: 1 },
 *   relations: ['tokens']
 * });
 * ```
 *
 * 4. 更新用户信息：
 * ```typescript
 * await userRepository.update(
 *   { id: 1 },
 *   { last_seen: new Date() }
 * );
 * ```
 */

/**
 * 数据库表结构对应：
 *
 * CREATE TABLE users (
 *   id INT AUTO_INCREMENT PRIMARY KEY,
 *   username VARCHAR(100) UNIQUE NOT NULL,
 *   password_hash VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   last_seen TIMESTAMP NULL,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 *   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
 * );
 */

/**
 * 实体设计原则：
 *
 * 1. 数据完整性：
 *    - 主键自增保证唯一性
 *    - 唯一约束防止重复数据
 *    - 非空约束保证必要字段
 *
 * 2. 安全性：
 *    - 密码字段命名明确（password_hash）
 *    - 不存储明文密码
 *    - 邮箱唯一性验证
 *
 * 3. 可维护性：
 *    - 清晰的字段命名
 *    - 详细的注释说明
 *    - 合理的字段长度限制
 *
 * 4. 扩展性：
 *    - 预留时间戳字段
 *    - 灵活的关系定义
 *    - 支持未来功能扩展
 */
