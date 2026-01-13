# 拦截器目录 (Interceptors)

拦截器目录包含 NestJS 拦截器，用于在请求处理过程中添加横切关注点功能，如缓存、日志、转换等。

## 📁 目录结构

```
interceptors/
├── cache.interceptor.ts    # HTTP 缓存拦截器 - 强缓存和协商缓存
└── README.md              # 本文档
```

## 🎯 拦截器职责

### 1. 请求/响应处理
- 在控制器方法执行前后进行处理
- 修改请求或响应数据
- 添加额外的功能逻辑
- 实现横切关注点

### 2. 性能优化
- HTTP 缓存控制
- 响应压缩
- 数据转换优化
- 请求去重

### 3. 监控和日志
- 请求响应时间记录
- 错误日志记录
- 性能指标收集
- 调试信息输出

## 📋 拦截器详情

### CacheInterceptor (HTTP 缓存拦截器)

**功能：** 为 GET 请求添加 HTTP 缓存支持

**缓存策略：**
- **强缓存 (Cache-Control)**: 控制浏览器和代理服务器的缓存行为
- **协商缓存 (ETag, Last-Modified)**: 通过内容验证减少数据传输
- **条件请求**: 处理 If-None-Match 和 If-Modified-Since 头

**主要功能：**
1. **强缓存控制**
   - Cache-Control 头设置
   - Expires 头设置
   - 公共/私有缓存控制
   - 缓存时间配置

2. **协商缓存实现**
   - ETag 生成和验证
   - Last-Modified 时间戳
   - 条件请求处理
   - 304 Not Modified 响应

3. **灵活配置**
   - 装饰器配置支持
   - 路由级别配置
   - 预定义缓存策略
   - 动态缓存控制

**使用示例：**

#### 1. 全局启用缓存
```typescript
// app.module.ts
import { CacheInterceptor } from './interceptors/cache.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### 2. 控制器级别配置
```typescript
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';

@Controller('api')
@CacheConfig(CacheConfigs.MEDIUM) // 5分钟缓存
export class ApiController {
  
  @Get('data')
  getData() {
    return { message: 'This will be cached for 5 minutes' };
  }
}
```

#### 3. 方法级别配置
```typescript
@Controller('users')
export class UsersController {
  
  @Get()
  @CacheConfig(CacheConfigs.SHORT) // 1分钟缓存
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @CacheConfig(CacheConfigs.PRIVATE) // 私有缓存
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('static')
  @CacheConfig(CacheConfigs.STATIC) // 静态资源缓存
  getStaticData() {
    return { version: '1.0.0', build: 'production' };
  }
}
```

#### 4. 自定义缓存配置
```typescript
@Get('custom')
@CacheConfig({
  maxAge: 1800,        // 30分钟强缓存
  sMaxAge: 3600,       // 1小时共享缓存
  public: true,        // 公共缓存
  mustRevalidate: true // 必须重新验证
})
getCustomData() {
  return this.dataService.getCustomData();
}
```

#### 5. 禁用特定路由的缓存
```typescript
@Get('dynamic')
@CacheConfig(CacheConfigs.NO_CACHE)
getDynamicData() {
  return { timestamp: Date.now(), random: Math.random() };
}
```

## 🔧 缓存配置选项

### CacheConfig 接口
```typescript
interface CacheConfig {
  maxAge?: number;           // 强缓存时间（秒）
  sMaxAge?: number;          // 共享缓存时间（秒）
  mustRevalidate?: boolean;  // 是否必须重新验证
  noCache?: boolean;         // 是否禁用缓存
  private?: boolean;         // 是否为私有缓存
  public?: boolean;          // 是否为公共缓存
}
```

### 预定义配置
```typescript
const CacheConfigs = {
  SHORT: {      // 短期缓存 (1分钟)
    maxAge: 60,
    sMaxAge: 120,
    public: true,
    mustRevalidate: true,
  },
  
  MEDIUM: {     // 中期缓存 (5分钟)
    maxAge: 300,
    sMaxAge: 600,
    public: true,
    mustRevalidate: true,
  },
  
  LONG: {       // 长期缓存 (1小时)
    maxAge: 3600,
    sMaxAge: 7200,
    public: true,
    mustRevalidate: true,
  },
  
  PRIVATE: {    // 私有缓存
    maxAge: 300,
    private: true,
    mustRevalidate: true,
  },
  
  NO_CACHE: {   // 禁用缓存
    noCache: true,
  },
  
  STATIC: {     // 静态资源缓存 (1天)
    maxAge: 86400,
    sMaxAge: 86400,
    public: true,
    mustRevalidate: false,
  },
};
```

## 📊 HTTP 缓存机制

### 强缓存 (Strong Cache)
```
客户端请求 → 检查本地缓存 → 缓存有效 → 直接使用缓存
                ↓
            缓存过期 → 发送请求到服务器
```

**相关头部：**
- `Cache-Control: public, max-age=300`
- `Expires: Wed, 21 Oct 2024 07:28:00 GMT`

### 协商缓存 (Negotiation Cache)
```
客户端请求 → 发送条件请求头 → 服务器验证 → 内容未变 → 返回 304
                                    ↓
                                内容已变 → 返回新内容 + 新 ETag
```

**相关头部：**
- `ETag: W/"abc123"`
- `Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT`
- `If-None-Match: W/"abc123"`
- `If-Modified-Since: Wed, 21 Oct 2024 07:28:00 GMT`

## 🚀 性能优化效果

### 1. 减少服务器负载
- 强缓存避免重复请求
- 协商缓存减少数据传输
- 304 响应节省带宽

### 2. 提升用户体验
- 更快的页面加载速度
- 减少网络延迟
- 降低流量消耗

### 3. 缓存命中率统计
```typescript
// 可以添加缓存统计功能
private cacheStats = {
  hits: 0,      // 缓存命中次数
  misses: 0,    // 缓存未命中次数
  total: 0,     // 总请求次数
};

getCacheHitRate(): number {
  return this.cacheStats.total > 0 
    ? this.cacheStats.hits / this.cacheStats.total 
    : 0;
}
```

## 🧪 测试缓存功能

### 1. 使用 curl 测试
```bash
# 第一次请求
curl -I "https://localhost:7002/api/data"

# 检查响应头
# Cache-Control: public, max-age=300, must-revalidate
# ETag: W/"abc123"
# Last-Modified: Wed, 21 Oct 2024 07:28:00 GMT

# 条件请求测试
curl -I "https://localhost:7002/api/data" \
  -H "If-None-Match: W/\"abc123\""

# 应该返回 304 Not Modified
```

### 2. 浏览器开发者工具
- Network 面板查看缓存状态
- 检查 `from disk cache` 或 `from memory cache`
- 验证 304 响应

### 3. 单元测试
```typescript
describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;

  beforeEach(() => {
    interceptor = new CacheInterceptor();
  });

  it('should set cache headers for GET requests', async () => {
    const mockRequest = { method: 'GET', url: '/api/test' };
    const mockResponse = {
      header: jest.fn(),
      status: jest.fn(),
      getHeader: jest.fn(),
    };

    // 测试缓存头设置
    // ...
  });

  it('should return 304 for conditional requests', async () => {
    // 测试条件请求处理
    // ...
  });
});
```

## 🔧 高级配置

### 1. 基于用户的缓存
```typescript
private generateETag(data: any, request: FastifyRequest): string {
  const content = JSON.stringify({
    data: data,
    url: request.url,
    userId: request.user?.id, // 用户特定的 ETag
  });
  
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return `W/"${hash}"`;
}
```

### 2. 缓存失效策略
```typescript
@Injectable()
export class CacheInvalidationService {
  // 当数据更新时，使相关缓存失效
  async invalidateCache(pattern: string) {
    // 实现缓存失效逻辑
  }
}
```

### 3. 分布式缓存
```typescript
// 结合 Redis 实现分布式缓存
@Injectable()
export class DistributedCacheInterceptor {
  constructor(private redisService: RedisService) {}
  
  // 实现分布式缓存逻辑
}
```

## 📚 相关文档

- [HTTP 缓存规范](https://tools.ietf.org/html/rfc7234)
- [NestJS 拦截器文档](https://docs.nestjs.com/interceptors)
- [MDN HTTP 缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cache-Control 指令](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)