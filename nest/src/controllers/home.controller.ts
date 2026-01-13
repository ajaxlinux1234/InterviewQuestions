/**
 * 首页控制器 (home.controller.ts)
 * 
 * 这是处理首页和系统信息请求的控制器，负责：
 * 1. 展示系统欢迎信息
 * 2. 显示 HTTP/2.0 协议状态
 * 3. 提供 API 端点列表
 * 4. 展示服务器功能特性
 * 
 * 缓存策略：
 * - 系统信息相对稳定，使用中期缓存（5分钟）
 * - 减少服务器负载，提高响应速度
 */

import { Controller, Get, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';

/**
 * 首页控制器
 * 
 * @Controller() 装饰器：
 * - 不指定路由前缀，表示根路径控制器
 * - 处理应用的根路径请求
 * 
 * @CacheConfig() 装饰器：
 * - 为整个控制器设置缓存策略
 * - 使用中期缓存配置（5分钟）
 * - 系统信息变化不频繁，适合缓存
 */
@Controller()
@CacheConfig(CacheConfigs.MEDIUM) // 5分钟缓存，适合系统信息
export class HomeController {
  
  /**
   * 系统首页接口
   * 
   * @Get() 装饰器：
   * - 处理 GET / 请求
   * - 返回系统欢迎信息和功能介绍
   * 
   * 缓存特性：
   * - 继承控制器级别的缓存配置
   * - 5分钟强缓存 + 协商缓存
   * - 减少重复的系统信息查询
   * 
   * @param req Fastify 请求对象，用于获取协议信息
   * @returns 系统信息对象
   */
  @Get()
  async index(@Req() req: FastifyRequest) {
    // 获取协议信息 (支持自定义 HTTP/2 检测)
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || (req as any).isHTTP2 || false;
    const protocol = req.protocol;
    const isSecure = req.protocol === 'https';
    
    // 返回系统信息（此数据将被缓存5分钟）
    return {
      message: 'Welcome to HTTP/2.0 NestJS Server! 🚀',
      timestamp: new Date().toISOString(),
      status: 'success',
      server: {
        framework: 'NestJS',
        version: '11.x',
        protocol: httpVersion,
        scheme: protocol,
        encrypted: isSecure,
        http2Enabled: isHTTP2
      },
      endpoints: {
        user: '/user?userId=yourname',
        push: '/push (HTTP/2 server push demo)',
        health: 'Direct database test available'
      },
      http2Features: {
        multiplexing: 'Multiple requests over single connection',
        headerCompression: 'HPACK compression reduces overhead',
        serverPush: 'Server can push resources proactively',
        binaryProtocol: 'More efficient than text-based HTTP/1.1'
      },
      cache: {
        enabled: true,
        strategy: 'medium-term',
        duration: '5 minutes',
        type: 'public cache with revalidation'
      }
    };
  }
}