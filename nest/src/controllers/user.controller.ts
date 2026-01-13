import { Controller, Get, Query, Req, Res, Param } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';

/**
 * 用户控制器 (user.controller.ts)
 * 
 * 负责处理用户相关的 HTTP 请求，包括：
 * 1. 获取用户信息（支持查询参数和路径参数两种格式）
 * 2. HTTP/2.0 功能演示
 * 3. 协议版本检测和特性展示
 * 
 * NestJS 控制器概念：
 * - @Controller(): 控制器装饰器，定义路由前缀
 * - @Get(): HTTP GET 方法装饰器
 * - @Query(): 获取查询参数
 * - @Param(): 获取路径参数
 * - @Req(): 获取请求对象
 */
@Controller('user')
export class UserController {
  /**
   * 获取用户信息 - 查询参数格式
   * 
   * 路由：GET /user?userId=xxx
   * 
   * @CacheConfig 装饰器配置缓存策略：
   * - 使用 MEDIUM 缓存策略（5分钟强缓存 + ETag协商缓存）
   * - 用户信息相对稳定，适合使用中期缓存策略
   */
  @Get()
  @CacheConfig(CacheConfigs.MEDIUM)
  async index(@Query('userId') userId: string = 'guest', @Req() req: FastifyRequest) {
    console.log('**用户请求 - HTTP/2.0 服务 (Query)**', userId);
    
    return this.getUserResponse(userId, req);
  }

  /**
   * 获取用户信息 - 路径参数格式
   * 
   * 路由：GET /user/:userId
   * 
   * 使用相同的缓存策略，因为返回的数据类型相同
   */
  @Get(':userId')
  @CacheConfig(CacheConfigs.MEDIUM)
  async getUserById(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    console.log('**用户请求 - HTTP/2.0 服务 (Param)**', userId);
    
    return this.getUserResponse(userId, req);
  }

  /**
   * 生成用户响应数据的私有方法
   * 
   * 包含 HTTP/2 协议检测和特性展示
   */
  private getUserResponse(userId: string, req: FastifyRequest) {
    // 获取 HTTP 版本信息 (支持自定义 HTTP/2 检测)
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || (req as any).isHTTP2 || false;
    const protocol = req.protocol;
    const isSecure = req.protocol === 'https';
    
    return {
      message: `Hello, ${userId}!`,
      timestamp: new Date().toISOString(),
      status: 'success',
      version: '2.0.0 - HTTP/2 Enabled',
      protocol: {
        version: httpVersion,
        scheme: protocol,
        encrypted: isSecure,
        http2: isHTTP2
      },
      features: {
        multiplexing: isHTTP2,
        headerCompression: isHTTP2,
        serverPush: isHTTP2
      },
      requestFormat: userId === 'guest' ? 'query-parameter' : 'path-parameter'
    };
  }
}

/**
 * HTTP/2 服务器推送演示控制器
 * 
 * 演示 HTTP/2 的服务器推送功能
 */
@Controller('push')
export class PushController {
  /**
   * HTTP/2 服务器推送演示
   * 
   * 路由：GET /push
   * 
   * @CacheConfig 装饰器配置：
   * - 使用 SHORT 缓存策略（1分钟强缓存）
   * - 演示数据变化较快，使用短期缓存
   */
  @Get()
  @CacheConfig(CacheConfigs.SHORT)
  async push(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0';
    
    // 检查是否支持 HTTP/2 服务器推送
    if (isHTTP2 && (req.raw as any).stream && (req.raw as any).stream.pushAllowed) {
      try {
        // 推送一个资源
        const pushStream = (req.raw as any).stream.pushStream({
          ':path': '/api/pushed-resource',
          ':method': 'GET'
        }, (err: any, pushStream: any) => {
          if (err) {
            console.log('⚠️  Server push failed:', err.message);
            return;
          }
          
          pushStream.respond({
            'content-type': 'application/json',
            ':status': 200
          });
          
          pushStream.end(JSON.stringify({
            message: 'This is a pushed resource!',
            timestamp: new Date().toISOString(),
            pushed: true
          }));
          
          console.log('📡 Server push executed');
        });
        
      } catch (error) {
        console.log('⚠️  Server push failed:', error.message);
      }
    }
    
    const response = {
      message: 'Server push demonstration',
      timestamp: new Date().toISOString(),
      http2: isHTTP2,
      pushSupported: isHTTP2 && (req.raw as any).stream && (req.raw as any).stream.pushAllowed
    };
    
    res.send(response);
  }
}