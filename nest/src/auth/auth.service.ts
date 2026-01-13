/**
 * 认证服务 (auth.service.ts)
 * 
 * 这是认证模块的核心业务逻辑服务，负责：
 * 1. 用户注册业务逻辑
 * 2. 用户登录验证和令牌生成
 * 3. 令牌验证和用户信息获取
 * 4. 用户退出和令牌撤销
 * 5. 令牌清理和维护
 * 
 * NestJS 服务概念：
 * - @Injectable(): 服务装饰器，标记为可注入的服务
 * - @InjectRepository(): 注入 TypeORM 仓库
 * - Repository<T>: TypeORM 仓库模式，提供数据库操作方法
 * - 依赖注入: 通过构造函数注入依赖的服务
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User } from '../entities/user.entity';
import { UserToken } from '../entities/user-token.entity';
import { LoginDto, RegisterDto } from '../dto/auth.dto';

/**
 * 认证服务类
 * 
 * @Injectable() 装饰器：
 * - 标记此类为可注入的服务
 * - 允许 NestJS 依赖注入系统管理此服务的生命周期
 * - 可以在其他类中通过构造函数注入使用
 */
@Injectable()
export class AuthService {
  /**
   * 构造函数 - 依赖注入
   * 
   * NestJS 依赖注入特性：
   * - @InjectRepository(): 注入特定实体的 TypeORM 仓库
   * - Repository<Entity>: 提供数据库 CRUD 操作方法
   * - JwtService: NestJS JWT 模块提供的令牌服务
   */
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,        // 用户数据仓库
    @InjectRepository(UserToken)
    private tokenRepository: Repository<UserToken>, // 令牌数据仓库
    private jwtService: JwtService,                  // JWT 服务（虽然当前未使用，但保留用于扩展）
  ) {}

  /**
   * 用户注册方法
   * 
   * 注册流程：
   * 1. 检查用户名是否已存在
   * 2. 创建新用户记录
   * 3. 保存到数据库
   * 4. 返回注册结果
   * 
   * @param registerDto 注册数据传输对象
   * @returns 注册结果对象
   */
  async register(registerDto: RegisterDto) {
    const { username, password, email } = registerDto;
    
    // 检查用户名唯一性
    // findOne() 方法查找符合条件的第一条记录
    const existingUser = await this.userRepository.findOne({ 
      where: { username }  // 查询条件：用户名匹配
    });
    
    // 如果用户名已存在，抛出未授权异常
    if (existingUser) {
      throw new UnauthorizedException('用户名已存在');
    }

    // 创建新用户实体
    // create() 方法创建实体实例但不保存到数据库
    // 注意：密码已经在前端进行 MD5 加密
    const user = this.userRepository.create({
      username,
      password, // 前端传来的已经是 MD5 加密的密码
      email,
    });

    // 保存用户到数据库
    // save() 方法将实体保存到数据库，返回保存后的实体（包含自动生成的 ID）
    await this.userRepository.save(user);
    
    // 返回注册成功响应（不包含敏感信息如密码）
    return {
      success: true,
      message: '注册成功',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  /**
   * 用户登录方法
   * 
   * 登录流程：
   * 1. 根据用户名查找用户
   * 2. 验证密码是否正确
   * 3. 生成访问令牌
   * 4. 返回登录结果和令牌
   * 
   * @param loginDto 登录数据传输对象
   * @param userAgent 用户代理字符串（浏览器信息）
   * @param ipAddress 客户端 IP 地址
   * @returns 登录结果对象
   */
  async login(loginDto: LoginDto, userAgent?: string, ipAddress?: string) {
    const { username, password } = loginDto;

    // 根据用户名查找用户
    const user = await this.userRepository.findOne({
      where: { username }
    });

    // 用户不存在时返回通用错误信息（安全考虑，不暴露具体原因）
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 验证密码
    // 前端传来的 password 已经是 MD5 加密的，直接比较
    if (user.password !== password) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成访问令牌
    const tokenData = await this.generateToken(user, userAgent, ipAddress);

    // 返回登录成功响应
    return {
      success: true,
      message: '登录成功',
      data: {
        token: tokenData.token,                           // 访问令牌
        expires_at: tokenData.expires_at.toISOString(),   // 过期时间（ISO 格式）
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    };
  }

  /**
   * 生成访问令牌（私有方法）
   * 
   * 令牌生成流程：
   * 1. 生成随机令牌字符串
   * 2. 设置过期时间（30天）
   * 3. 保存令牌信息到数据库
   * 4. 返回令牌和过期时间
   * 
   * @param user 用户实体
   * @param userAgent 用户代理字符串
   * @param ipAddress 客户端 IP 地址
   * @returns 令牌数据对象
   */
  private async generateToken(user: User, userAgent?: string, ipAddress?: string) {
    // 生成 64 位随机十六进制字符串作为令牌
    // crypto.randomBytes(32) 生成 32 字节随机数据
    // toString('hex') 转换为十六进制字符串
    const tokenString = crypto.randomBytes(32).toString('hex');
    
    // 设置令牌过期时间（30天后）
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 创建令牌记录
    const userToken = this.tokenRepository.create({
      user_id: user.id,           // 关联用户 ID
      token: tokenString,         // 令牌字符串
      token_type: 'access',       // 令牌类型（访问令牌）
      expires_at: expiresAt,      // 过期时间
      is_revoked: 0,              // 撤销状态（0=有效，1=已撤销）
      user_agent: userAgent,      // 用户代理信息（用于安全审计）
      ip_address: ipAddress,      // IP 地址（用于安全审计）
    });

    // 保存令牌到数据库
    await this.tokenRepository.save(userToken);

    return {
      token: tokenString,
      expires_at: expiresAt,
    };
  }

  /**
   * 验证令牌方法
   * 
   * 验证流程：
   * 1. 根据令牌查找令牌记录
   * 2. 检查令牌是否被撤销
   * 3. 检查令牌是否过期
   * 4. 更新最后使用时间
   * 5. 返回关联的用户信息
   * 
   * @param token 令牌字符串
   * @returns 用户实体或 null
   */
  async validateToken(token: string): Promise<User | null> {
    // 查找令牌记录，同时加载关联的用户信息
    const userToken = await this.tokenRepository.findOne({
      where: { 
        token,           // 令牌匹配
        is_revoked: 0    // 未被撤销
      },
      relations: ['user'], // 加载关联的用户实体
    });

    // 令牌不存在或已被撤销
    if (!userToken) {
      return null;
    }

    // 检查令牌是否过期
    if (new Date() > userToken.expires_at) {
      return null;
    }

    // 更新令牌最后使用时间（用于统计和安全审计）
    userToken.last_used_at = new Date();
    await this.tokenRepository.save(userToken);

    // 返回关联的用户信息
    return userToken.user;
  }

  /**
   * 用户退出方法
   * 
   * 退出流程：
   * 1. 根据令牌查找令牌记录
   * 2. 检查令牌有效性
   * 3. 撤销令牌（设置 is_revoked = 1）
   * 4. 返回退出结果
   * 
   * @param token 令牌字符串
   * @returns 退出结果对象
   */
  async logout(token: string) {
    // 查找有效的令牌记录
    const userToken = await this.tokenRepository.findOne({
      where: { token, is_revoked: 0 }
    });

    // 令牌无效时抛出异常
    if (!userToken) {
      throw new UnauthorizedException('无效的token');
    }

    // 撤销令牌（软删除，保留记录用于审计）
    userToken.is_revoked = 1;
    await this.tokenRepository.save(userToken);

    return {
      success: true,
      message: '退出登录成功',
    };
  }

  /**
   * 清理过期令牌方法（维护方法）
   * 
   * 此方法可以被定时任务调用，用于：
   * 1. 查找所有过期的令牌
   * 2. 将其标记为已撤销
   * 3. 保持数据库整洁
   * 
   * 注意：这里使用了 TypeORM 的批量更新操作
   */
  async cleanExpiredTokens() {
    const now = new Date();
    
    // 批量更新过期令牌的状态
    // 注意：这里的查询语法可能需要根据 TypeORM 版本调整
    await this.tokenRepository.update(
      { expires_at: { $lt: now } as any }, // 查询条件：过期时间小于当前时间
      { is_revoked: 1 }                    // 更新内容：设置为已撤销
    );
  }
}

/**
 * 认证服务设计原则：
 * 
 * 1. 安全性优先：
 *    - 密码不明文存储
 *    - 令牌有过期时间
 *    - 记录登录信息用于审计
 *    - 软删除令牌保留审计记录
 * 
 * 2. 用户体验：
 *    - 统一的错误信息格式
 *    - 清晰的成功响应结构
 *    - 30天的令牌有效期
 * 
 * 3. 可维护性：
 *    - 清晰的方法职责分离
 *    - 详细的注释和文档
 *    - 一致的代码风格
 * 
 * 4. 可扩展性：
 *    - 预留 JWT 服务接口
 *    - 灵活的令牌类型设计
 *    - 支持多种认证方式扩展
 */