/**
 * 认证模块 (auth.module.ts)
 * 
 * 这是用户认证功能的模块，负责：
 * 1. 配置 JWT (JSON Web Token) 认证
 * 2. 注册认证相关的控制器和服务
 * 3. 配置数据库实体访问
 * 4. 导出认证服务供其他模块使用
 * 
 * NestJS 模块概念：
 * - 功能模块：将相关功能组织在一起
 * - TypeOrmModule.forFeature(): 为特定实体注册仓库
 * - JwtModule: JWT 令牌处理模块
 * - exports: 导出服务供其他模块使用
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { User } from '../entities/user.entity';
import { UserToken } from '../entities/user-token.entity';

/**
 * 认证模块
 * 
 * 模块组织原则：
 * 1. 单一职责：只处理认证相关功能
 * 2. 高内聚：相关的控制器、服务、实体都在一个模块中
 * 3. 低耦合：通过依赖注入与其他模块交互
 */
@Module({
  imports: [
    // 为认证模块注册数据库实体
    // forFeature() 方法为当前模块注册特定的实体仓库
    TypeOrmModule.forFeature([
      User,       // 用户实体 - 对应 users 表
      UserToken,  // 用户令牌实体 - 对应 user_tokens 表
    ]),
    
    // JWT 模块配置
    // JWT (JSON Web Token) 用于无状态的用户认证
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',  // JWT 签名密钥（生产环境应使用环境变量）
      signOptions: { expiresIn: '30d' },                    // 令牌过期时间（30天）
    }),
  ],
  
  // 认证控制器
  // 处理认证相关的 HTTP 请求（登录、注册、退出等）
  controllers: [AuthController],
  
  // 认证服务提供者
  providers: [
    AuthService,  // 认证业务逻辑服务
    AuthGuard,    // 认证守卫（用于保护需要登录的路由）
  ],
  
  // 导出服务
  // 其他模块可以导入这些服务来使用认证功能
  exports: [
    AuthService,  // 导出认证服务，供其他模块使用
    AuthGuard,    // 导出认证守卫，供其他模块的路由保护使用
  ],
})
export class AuthModule {
  /**
   * 认证模块特点：
   * 
   * 1. 安全性：
   *    - JWT 令牌认证
   *    - 密码 MD5 加密
   *    - 令牌过期管理
   *    - IP 和 User-Agent 记录
   * 
   * 2. 功能完整：
   *    - 用户注册
   *    - 用户登录
   *    - 令牌验证
   *    - 用户退出
   *    - 获取用户信息
   * 
   * 3. 数据持久化：
   *    - 用户信息存储
   *    - 令牌状态管理
   *    - 登录日志记录
   */
}