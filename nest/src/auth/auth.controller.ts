/**
 * 认证控制器 (auth.controller.ts)
 * 
 * 这是处理用户认证相关 HTTP 请求的控制器，负责：
 * 1. 处理用户注册请求
 * 2. 处理用户登录请求
 * 3. 处理用户退出请求
 * 4. 处理获取用户信息请求
 * 
 * NestJS 控制器概念：
 * - @Controller(): 控制器装饰器，定义路由前缀
 * - @Post(), @Get(): HTTP 方法装饰器
 * - @Body(): 获取请求体数据
 * - @Headers(): 获取请求头数据
 * - @Req(): 获取完整的请求对象
 * - @UseGuards(): 使用守卫保护路由
 */

import { Controller, Post, Body, Req, Headers, Get, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';
// @ts-ignore
import { AuthGuard } from './auth.guard';

/**
 * 认证控制器
 * 
 * @Controller('auth') 装饰器：
 * - 定义控制器的路由前缀为 '/auth'
 * - 所有方法的路由都会以 '/auth' 开头
 * 
 * 路由映射：
 * - POST /auth/register -> register()
 * - POST /auth/login -> login()
 * - POST /auth/logout -> logout()
 * - GET /auth/profile -> getProfile()
 */
@Controller('auth')
export class AuthController {
  /**
   * 构造函数依赖注入
   * 
   * NestJS 依赖注入系统会自动注入 AuthService 实例
   * 这是控制器与服务层解耦的关键机制
   */
  constructor(private authService: AuthService) {}

  /**
   * 用户注册接口
   * 
   * @Post('register') 装饰器：
   * - 定义 HTTP POST 方法
   * - 路由路径：POST /auth/register
   * 
   * @Body() 装饰器：
   * - 自动解析请求体 JSON 数据
   * - 将数据映射到 RegisterDto 类型
   * - 提供类型安全和数据验证
   * 
   * 注意：POST 请求不使用缓存，因为每次注册都是新的操作
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    // 调用认证服务的注册方法
    // 业务逻辑在服务层处理，控制器只负责接收请求和返回响应
    return await this.authService.register(registerDto);
  }

  /**
   * 用户登录接口
   * 
   * 参数说明：
   * - @Body() loginDto: 登录数据（用户名、密码）
   * - @Req() req: Fastify 请求对象，用于获取客户端信息
   * - @Headers('user-agent') userAgent: 客户端浏览器信息
   * 
   * 注意：POST 请求不使用缓存，因为每次登录都需要验证和生成新的令牌
   */
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: FastifyRequest,
    @Headers('user-agent') userAgent?: string,
  ) {
    // 获取客户端 IP 地址
    // 用于安全日志记录和异常登录检测
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    // 调用认证服务处理登录逻辑
    return await this.authService.login(loginDto, userAgent, ipAddress);
  }

  /**
   * 用户退出接口
   * 
   * @UseGuards(AuthGuard) 装饰器：
   * - 使用认证守卫保护此路由
   * - 只有携带有效令牌的请求才能访问
   * - 守卫会验证令牌并将用户信息注入请求对象
   * 
   * @Headers('authorization') 装饰器：
   * - 获取 Authorization 请求头
   * - 通常格式为 "Bearer <token>"
   * 
   * 注意：POST 请求不使用缓存，因为退出登录是状态改变操作
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Headers('authorization') authorization: string) {
    // 从 Authorization header 中提取令牌
    // 移除 "Bearer " 前缀，获取纯令牌字符串
    const token = authorization?.replace('Bearer ', '');
    
    // 调用认证服务撤销令牌
    return await this.authService.logout(token);
  }

  /**
   * 获取用户信息接口
   * 
   * @UseGuards(AuthGuard) 装饰器：
   * - 保护此路由，需要有效令牌才能访问
   * - AuthGuard 会验证令牌并将用户信息注入到 req.user
   * 
   * @Req() req: any：
   * - 请求对象，AuthGuard 会在其中注入用户信息
   * - req.user 包含当前登录用户的完整信息
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 NO_CACHE 策略 - 不缓存策略
   * - 用户信息是敏感数据，且可能频繁变化，不适合缓存
   * - 每次请求都会返回最新的用户信息
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  @CacheConfig(CacheConfigs.NO_CACHE)
  async getProfile(@Req() req: any) {
    // AuthGuard 会将用户信息注入到 request 中
    // 这样控制器就可以直接获取当前登录用户的信息
    const user = req.user;
    
    // 返回用户基本信息（不包含敏感数据如密码）
    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    };
  }
}

/**
 * 控制器设计原则：
 * 
 * 1. 单一职责：只处理 HTTP 请求和响应
 * 2. 薄控制器：业务逻辑都在服务层
 * 3. 数据验证：使用 DTO 进行数据类型检查
 * 4. 安全性：使用守卫保护敏感路由
 * 5. 错误处理：让 NestJS 的异常过滤器处理错误
 * 6. 缓存策略：根据数据特性选择合适的缓存策略
 * 
 * HTTP 状态码：
 * - 200: 成功
 * - 201: 创建成功（注册）
 * - 401: 未授权（登录失败、令牌无效）
 * - 400: 请求参数错误
 * - 500: 服务器内部错误
 * 
 * 缓存策略说明：
 * - GET /auth/profile: NO_CACHE - 用户信息敏感且可能变化，不缓存
 * - POST 请求: 不使用缓存 - 状态改变操作不应缓存
 */