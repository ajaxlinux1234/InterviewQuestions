# HTTP 缓存实现文档

## 概述

本项目为所有 GET 请求实现了完整的 HTTP 缓存机制，包括强缓存和协商缓存，以提高 API 响应速度并减少服务器负载。

## 缓存策略

### 1. 强缓存 (Cache-Control)

强缓存通过 `Cache-Control` 头控制客户端缓存行为：

- **public**: 响应可以被任何缓存存储
- **private**: 响应只能被私有缓存存储（如浏览器）
- **max-age**: 缓存的最大生存时间（秒）
- **s-maxage**: 共享缓存的最大生存时间（秒）
- **must-revalidate**: 缓存过期后必须重新验证

### 2. 协商缓存 (ETag & Last-Modified)

协商缓存通过以下头部实现：

- **ETag**: 资源的唯一标识符
- **Last-Modified**: 资源的最后修改时间
- **If-None-Match**: 客户端发送的 ETag 值
- **If-Modified-Since**: 客户端发送的最后修改时间

## 预定义缓存配置

### SHORT (短期缓存)
```typescript
{
  maxAge: 60,        // 1分钟
  sMaxAge: 120,      // 2分钟 (共享缓存)
  public: true,
  mustRevalidate: true
}
```

### MEDIUM (中期缓存)
```typescript
{
  maxAge: 300,       // 5分钟
  sMaxAge: 600,      // 10分钟 (共享缓存)
  public: true,
  mustRevalidate: true
}
```

### LONG (长期缓存)
```typescript
{
  maxAge: 3600,      // 1小时
  sMaxAge: 7200,     // 2小时 (共享缓存)
  public: true,
  mustRevalidate: true
}
```

### PRIVATE (私有缓存)
```typescript
{
  maxAge: 300,       // 5分钟
  private: true,
  mustRevalidate: true
}
```

### NO_CACHE (禁用缓存)
```typescript
{
  noCache: true
}
```

### STATIC (静态资源缓存)
```typescript
{
  maxAge: 86400,     // 1天
  sMaxAge: 86400,    // 1天 (共享缓存)
  public: true,
  mustRevalidate: false
}
```

## 使用方法

### 1. 在控制器方法上使用

```typescript
import { CacheConfig, CacheConfigs } from '../interceptors/cache.interceptor';

@Controller('api')
export class ApiController {
  
  // 使用预定义配置
  @Get('users')
  @CacheConfig(CacheConfigs.MEDIUM)
  async getUsers() {
    return this.userService.findAll();
  }
  
  // 使用自定义配置
  @Get('profile')
  @CacheConfig({ maxAge: 600, private: true })
  async getProfile() {
    return this.userService.getProfile();
  }
  
  // 禁用缓存
  @Get('sensitive-data')
  @CacheConfig(CacheConfigs.NO_CACHE)
  async getSensitiveData() {
    return this.dataService.getSensitiveData();
  }
}
```

### 2. 在控制器类上使用（全局配置）

```typescript
@Controller('api')
@CacheConfig(CacheConfigs.MEDIUM)
export class ApiController {
  // 所有方法都会使用 MEDIUM 缓存配置
  // 除非方法级别有特定配置
}
```

## 当前实现状态

### 已配置的端点

1. **用户信息端点**
   - `GET /user?userId=xxx` - MEDIUM 缓存 (5分钟)
   - `GET /user/:userId` - MEDIUM 缓存 (5分钟)

2. **HTTP/2 推送演示**
   - `GET /push` - SHORT 缓存 (1分钟)

3. **认证端点**
   - `GET /auth/profile` - NO_CACHE (不缓存)

4. **首页端点**
   - `GET /` - LONG 缓存 (1小时)

## 工作原理

### 1. 请求流程

```
客户端请求 → CacheInterceptor → 检查缓存配置 → 设置响应头 → 返回数据
```

### 2. 条件请求处理

```
客户端发送 If-None-Match/If-Modified-Since → 
服务器比较 ETag/Last-Modified → 
如果匹配返回 304，否则返回 200 + 新数据
```

### 3. ETag 生成

ETag 基于以下内容生成：
- 响应数据
- 请求 URL
- 请求方法
- 可选的用户信息

## 测试

### 运行缓存测试

```bash
# 确保 NestJS 服务正在运行
npm run start:dev

# 运行缓存测试脚本
node test-cache.js
```

### 手动测试

```bash
# 首次请求
curl -v https://localhost:7002/user?userId=test

# 使用 ETag 进行条件请求
curl -v -H "If-None-Match: W/\"abc123\"" https://localhost:7002/user?userId=test

# 使用 Last-Modified 进行条件请求
curl -v -H "If-Modified-Since: Wed, 21 Oct 2015 07:28:00 GMT" https://localhost:7002/user?userId=test
```

## 性能优势

1. **减少网络传输**: 304 响应只包含头部，不包含响应体
2. **降低服务器负载**: 减少数据序列化和传输
3. **提升用户体验**: 更快的响应时间
4. **节省带宽**: 特别是对于大型响应数据

## 最佳实践

### 1. 缓存策略选择

- **静态数据**: 使用 LONG 或 STATIC 配置
- **用户数据**: 使用 MEDIUM 或 PRIVATE 配置
- **实时数据**: 使用 SHORT 配置
- **敏感数据**: 使用 NO_CACHE 配置

### 2. 缓存失效

- 数据更新时考虑缓存失效
- 使用版本号或时间戳来控制缓存
- 对于用户特定数据，考虑使用 PRIVATE 缓存

### 3. 监控和调试

- 检查响应头确认缓存配置正确
- 使用浏览器开发者工具查看缓存状态
- 监控 304 响应的比例来评估缓存效果

## 注意事项

1. **只对 GET 请求启用缓存**
2. **POST/PUT/DELETE 请求不会被缓存**
3. **ETag 是弱验证器 (W/ 前缀)**
4. **Last-Modified 精确到秒**
5. **缓存配置可以在方法级别覆盖类级别配置**

## 扩展功能

### 未来可能的改进

1. **Redis 缓存集成**: 服务器端缓存支持
2. **缓存预热**: 预先生成常用数据的缓存
3. **智能缓存失效**: 基于数据依赖的自动失效
4. **缓存统计**: 缓存命中率和性能指标
5. **条件缓存**: 基于用户角色或权限的缓存策略