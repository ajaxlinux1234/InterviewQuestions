/**
 * HTTP 缓存拦截器 (cache.interceptor.ts)
 * 
 * 这个拦截器为 GET 请求添加 HTTP 缓存支持，包括：
 * 1. 强缓存 (Cache-Control)
 * 2. 协商缓存 (ETag, Last-Modified)
 * 3. 条件请求处理 (If-None-Match, If-Modified-Since)
 * 
 * NestJS 拦截器概念：
 * - @Injectable(): 标记为可注入的拦截器
 * - NestInterceptor: 拦截器接口
 * - ExecutionContext: 执行上下文
 * - CallHandler: 调用处理器
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as crypto from 'crypto';

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  maxAge?: number;           // 强缓存时间（秒）
  sMaxAge?: number;          // 共享缓存时间（秒）
  mustRevalidate?: boolean;  // 是否必须重新验证
  noCache?: boolean;         // 是否禁用缓存
  private?: boolean;         // 是否为私有缓存
  public?: boolean;          // 是否为公共缓存
}

/**
 * HTTP 缓存拦截器
 * 
 * 缓存策略：
 * 1. 强缓存：使用 Cache-Control 头控制缓存时间
 * 2. 协商缓存：使用 ETag 和 Last-Modified 进行内容验证
 * 3. 条件请求：处理 If-None-Match 和 If-Modified-Since
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private defaultConfig: CacheConfig = {
    maxAge: 300,        // 默认 5 分钟强缓存
    sMaxAge: 600,       // 默认 10 分钟共享缓存
    mustRevalidate: true,
    public: true,
  };

  /**
   * 拦截器核心方法
   * 
   * 处理流程：
   * 1. 检查是否为 GET 请求
   * 2. 检查条件请求头
   * 3. 设置缓存响应头
   * 4. 生成 ETag 和 Last-Modified
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();

    // 只对 GET 请求启用缓存
    if (request.method !== 'GET') {
      return next.handle();
    }

    // 获取路由特定的缓存配置
    const routeConfig = this.getRouteConfig(context);
    const finalConfig = { ...this.defaultConfig, ...routeConfig };

    // 如果禁用缓存，直接返回
    if (finalConfig.noCache) {
      this.setNoCacheHeaders(response);
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 设置强缓存头
        this.setStrongCacheHeaders(response, finalConfig);

        // 设置协商缓存头
        this.setNegotiationCacheHeaders(response, data, request);

        // 检查条件请求
        if (this.checkConditionalRequest(request, response)) {
          // 返回 304 Not Modified
          response.status(304);
          return null;
        }

        return data;
      }),
    );
  }

  /**
   * 获取路由特定的缓存配置
   */
  private getRouteConfig(context: ExecutionContext): CacheConfig {
    const handler = context.getHandler();
    const controller = context.getClass();

    // 从装饰器元数据中获取缓存配置
    const handlerConfig = Reflect.getMetadata('cache-config', handler) || {};
    const controllerConfig = Reflect.getMetadata('cache-config', controller) || {};

    return { ...controllerConfig, ...handlerConfig };
  }

  /**
   * 设置强缓存头 (Cache-Control)
   */
  private setStrongCacheHeaders(response: FastifyReply, config: CacheConfig) {
    const cacheControlParts: string[] = [];

    // 设置缓存可见性
    if (config.public) {
      cacheControlParts.push('public');
    } else if (config.private) {
      cacheControlParts.push('private');
    }

    // 设置最大缓存时间
    if (config.maxAge !== undefined) {
      cacheControlParts.push(`max-age=${config.maxAge}`);
    }

    // 设置共享缓存时间
    if (config.sMaxAge !== undefined) {
      cacheControlParts.push(`s-maxage=${config.sMaxAge}`);
    }

    // 设置重新验证策略
    if (config.mustRevalidate) {
      cacheControlParts.push('must-revalidate');
    }

    // 设置 Cache-Control 头
    if (cacheControlParts.length > 0) {
      response.header('Cache-Control', cacheControlParts.join(', '));
    }

    // 设置 Expires 头（作为 Cache-Control 的备用）
    if (config.maxAge) {
      const expiresDate = new Date(Date.now() + config.maxAge * 1000);
      response.header('Expires', expiresDate.toUTCString());
    }
  }

  /**
   * 设置协商缓存头 (ETag, Last-Modified)
   */
  private setNegotiationCacheHeaders(
    response: FastifyReply,
    data: any,
    request: FastifyRequest,
  ) {
    // 生成 ETag
    const etag = this.generateETag(data, request);
    response.header('ETag', etag);

    // 设置 Last-Modified（使用当前时间或数据的更新时间）
    const lastModified = this.getLastModified(data);
    response.header('Last-Modified', lastModified.toUTCString());

    // 设置 Vary 头，告诉缓存服务器根据哪些请求头来区分缓存
    response.header('Vary', 'Accept, Accept-Encoding, Authorization');
  }

  /**
   * 设置禁用缓存头
   */
  private setNoCacheHeaders(response: FastifyReply) {
    response.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.header('Pragma', 'no-cache');
    response.header('Expires', '0');
  }

  /**
   * 检查条件请求
   * 
   * 处理 If-None-Match 和 If-Modified-Since 头
   */
  private checkConditionalRequest(
    request: FastifyRequest,
    response: FastifyReply,
  ): boolean {
    const ifNoneMatch = request.headers['if-none-match'];
    const ifModifiedSince = request.headers['if-modified-since'];
    const etag = response.getHeader('ETag') as string;
    const lastModified = response.getHeader('Last-Modified') as string;

    // 检查 If-None-Match (ETag 验证)
    if (ifNoneMatch && etag) {
      // 支持多个 ETag 值和 * 通配符
      const clientETags = ifNoneMatch.split(',').map(tag => tag.trim());
      if (clientETags.includes('*') || clientETags.includes(etag)) {
        return true; // 内容未修改
      }
    }

    // 检查 If-Modified-Since (时间验证)
    if (ifModifiedSince && lastModified) {
      const clientDate = new Date(ifModifiedSince);
      const serverDate = new Date(lastModified);
      
      // 如果服务器内容没有在客户端缓存时间之后修改，返回 304
      if (serverDate <= clientDate) {
        return true; // 内容未修改
      }
    }

    return false; // 内容已修改，需要返回新内容
  }

  /**
   * 生成 ETag
   * 
   * 基于响应数据和请求信息生成唯一标识
   */
  private generateETag(data: any, request: FastifyRequest): string {
    // 创建用于生成 ETag 的内容
    const content = JSON.stringify({
      data: data,
      url: request.url,
      method: request.method,
      // 可以添加用户信息以生成用户特定的 ETag
      // user: request.user?.id,
    });

    // 生成 MD5 哈希作为 ETag
    const hash = crypto.createHash('md5').update(content).digest('hex');
    
    // 返回弱 ETag（W/ 前缀表示弱验证）
    return `W/"${hash}"`;
  }

  /**
   * 获取最后修改时间
   * 
   * 尝试从数据中提取更新时间，否则使用当前时间
   */
  private getLastModified(data: any): Date {
    // 尝试从数据中获取更新时间
    if (data && typeof data === 'object') {
      // 检查常见的时间字段
      const timeFields = ['updated_at', 'updatedAt', 'modified_at', 'modifiedAt', 'last_modified'];
      
      for (const field of timeFields) {
        if (data[field]) {
          const date = new Date(data[field]);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }

      // 如果是数组，检查数组中的对象
      if (Array.isArray(data) && data.length > 0) {
        const latestDate = data.reduce((latest, item) => {
          const itemDate = this.getLastModified(item);
          return itemDate > latest ? itemDate : latest;
        }, new Date(0));
        
        if (latestDate.getTime() > 0) {
          return latestDate;
        }
      }
    }

    // 如果无法从数据中获取时间，使用当前时间
    // 注意：在生产环境中，这可能不是最佳实践
    // 建议使用应用启动时间或固定时间
    return new Date();
  }
}

/**
 * 缓存配置装饰器
 * 
 * 用于在控制器或方法上设置特定的缓存配置
 */
export function CacheConfig(config: CacheConfig) {
  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (propertyKey) {
      // 方法级别的配置
      Reflect.defineMetadata('cache-config', config, descriptor.value);
    } else {
      // 类级别的配置
      Reflect.defineMetadata('cache-config', config, target);
    }
  };
}

/**
 * 预定义的缓存配置
 */
export const CacheConfigs = {
  // 短期缓存 (1分钟)
  SHORT: {
    maxAge: 60,
    sMaxAge: 120,
    public: true,
    mustRevalidate: true,
  },

  // 中期缓存 (5分钟)
  MEDIUM: {
    maxAge: 300,
    sMaxAge: 600,
    public: true,
    mustRevalidate: true,
  },

  // 长期缓存 (1小时)
  LONG: {
    maxAge: 3600,
    sMaxAge: 7200,
    public: true,
    mustRevalidate: true,
  },

  // 私有缓存 (用户特定数据)
  PRIVATE: {
    maxAge: 300,
    private: true,
    mustRevalidate: true,
  },

  // 禁用缓存
  NO_CACHE: {
    noCache: true,
  },

  // 静态资源缓存 (1天)
  STATIC: {
    maxAge: 86400,
    sMaxAge: 86400,
    public: true,
    mustRevalidate: false,
  },
};