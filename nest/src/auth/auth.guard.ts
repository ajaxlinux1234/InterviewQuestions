/**
 * 认证守卫 (auth.guard.ts)
 * 
 * 这是 NestJS 的守卫组件，负责：
 * 1. 保护需要认证的路由
 * 2. 验证请求中的访问令牌
 * 3. 将用户信息注入到请求对象中
 * 4. 决定是否允许请求继续执行
 * 
 * NestJS 守卫概念：
 * - @Injectable(): 标记为可注入的服务
 * - CanActivate: 守卫接口，定义 canActivate 方法
 * - ExecutionContext: 执行上下文，包含请求和响应信息
 * - 守卫在控制器方法执行前运行
 * - 返回 true 允许请求继续，false 或抛出异常则拒绝请求
 */

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * 认证守卫类
 * 
 * 守卫的作用：
 * 1. 在路由处理器执行前进行权限检查
 * 2. 验证用户身份和访问权限
 * 3. 为后续处理提供用户上下文信息
 * 
 * 使用方式：
 * - 在控制器类上使用：@UseGuards(AuthGuard) - 保护整个控制器
 * - 在方法上使用：@UseGuards(AuthGuard) - 保护特定方法
 * - 全局使用：app.useGlobalGuards(new AuthGuard()) - 保护所有路由
 */
@Injectable()
export class AuthGuard implements CanActivate {
  /**
   * 构造函数依赖注入
   * 
   * 注入 AuthService 用于验证令牌和获取用户信息
   * NestJS 依赖注入系统会自动提供 AuthService 实例
   */
  constructor(private authService: AuthService) {}

  /**
   * 守卫核心方法 - 决定是否允许访问
   * 
   * 认证流程：
   * 1. 从请求头中提取 Authorization 信息
   * 2. 解析出访问令牌
   * 3. 调用认证服务验证令牌
   * 4. 将用户信息注入到请求对象中
   * 5. 返回验证结果
   * 
   * @param context 执行上下文，包含请求、响应等信息
   * @returns Promise<boolean> - true 表示允许访问，false 表示拒绝
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取 HTTP 请求对象
    // ExecutionContext 是 NestJS 提供的执行上下文抽象
    // switchToHttp() 切换到 HTTP 上下文
    // getRequest() 获取原始的请求对象
    const request = context.switchToHttp().getRequest();
    
    // 获取 Authorization 请求头
    // 标准格式：Authorization: Bearer <token>
    const authorization = request.headers.authorization;

    // 检查是否提供了 Authorization 头
    if (!authorization) {
      throw new UnauthorizedException('缺少Authorization header');
    }

    // 提取令牌字符串
    // 移除 "Bearer " 前缀，获取纯令牌字符串
    const token = authorization.replace('Bearer ', '');
    
    // 检查令牌是否为空
    if (!token) {
      throw new UnauthorizedException('缺少token');
    }

    // 调用认证服务验证令牌
    // validateToken 方法会：
    // 1. 检查令牌是否存在于数据库中
    // 2. 检查令牌是否已被撤销
    // 3. 检查令牌是否过期
    // 4. 返回关联的用户信息
    const user = await this.authService.validateToken(token);
    
    // 令牌验证失败
    if (!user) {
      throw new UnauthorizedException('无效或过期的token');
    }

    // 将用户信息注入到请求对象中
    // 这样后续的控制器方法就可以通过 req.user 访问当前用户信息
    // 这是一个重要的设计模式：守卫不仅验证权限，还提供上下文信息
    request.user = user;
    
    // 返回 true 表示验证通过，允许请求继续执行
    return true;
  }
}

/**
 * 守卫使用示例：
 * 
 * 1. 保护单个方法：
 * ```typescript
 * @Get('profile')
 * @UseGuards(AuthGuard)
 * async getProfile(@Req() req: any) {
 *   const user = req.user; // 守卫注入的用户信息
 *   return { user };
 * }
 * ```
 * 
 * 2. 保护整个控制器：
 * ```typescript
 * @Controller('admin')
 * @UseGuards(AuthGuard)
 * export class AdminController {
 *   // 所有方法都需要认证
 * }
 * ```
 * 
 * 3. 全局守卫（在 main.ts 中）：
 * ```typescript
 * app.useGlobalGuards(new AuthGuard(authService));
 * ```
 */

/**
 * 守卫设计原则：
 * 
 * 1. 单一职责：
 *    - 只负责认证验证
 *    - 不处理业务逻辑
 *    - 不修改请求数据
 * 
 * 2. 安全性：
 *    - 默认拒绝访问
 *    - 详细的错误信息
 *    - 令牌格式验证
 * 
 * 3. 可复用性：
 *    - 可用于任何需要认证的路由
 *    - 统一的认证逻辑
 *    - 易于测试和维护
 * 
 * 4. 性能考虑：
 *    - 异步操作避免阻塞
 *    - 缓存用户信息减少数据库查询
 *    - 快速失败原则
 */

/**
 * 错误处理：
 * 
 * 守卫抛出的异常会被 NestJS 的异常过滤器捕获：
 * - UnauthorizedException -> HTTP 401 状态码
 * - 其他异常 -> HTTP 500 状态码
 * 
 * 客户端应该根据状态码处理：
 * - 401: 重定向到登录页面
 * - 403: 显示权限不足提示
 * - 500: 显示系统错误提示
 */