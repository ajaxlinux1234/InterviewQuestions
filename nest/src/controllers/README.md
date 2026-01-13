# 控制器目录 (Controllers)

控制器目录包含处理 HTTP 请求的控制器类，负责接收客户端请求、调用业务逻辑并返回响应。

## 📁 目录结构

```
controllers/
├── home.controller.ts    # 首页控制器 - 系统信息和欢迎页面
├── user.controller.ts    # 用户控制器 - 用户信息和 HTTP/2 演示
└── README.md            # 本文档
```

## 🎯 控制器职责

### 1. HTTP 请求处理
- 接收和解析 HTTP 请求
- 提取请求参数和数据
- 调用相应的业务逻辑
- 返回格式化的响应

### 2. 路由管理
- 定义 API 端点
- 配置请求方法（GET、POST 等）
- 设置路由参数和查询参数
- 管理路由前缀

### 3. 数据验证
- 验证请求参数格式
- 检查必需字段
- 类型转换和校验
- 错误信息返回

### 4. 响应格式化
- 统一响应结构
- 状态码设置
- 错误处理
- 数据序列化

## 📋 控制器详情

### HomeController (首页控制器)

**功能：** 提供系统信息和欢迎页面

**路由：** `/`

**方法：**
- `GET /` - 获取系统信息和 HTTP/2 状态

**特性：**
- HTTP/2 协议检测
- 服务器信息展示
- 功能端点列表
- 协议特性说明

**响应示例：**
```json
{
  "message": "Welcome to HTTP/2.0 NestJS Server! 🚀",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "status": "success",
  "server": {
    "framework": "NestJS",
    "version": "11.x",
    "protocol": "2.0",
    "scheme": "https",
    "encrypted": true,
    "http2Enabled": true
  },
  "endpoints": {
    "user": "/user?userId=yourname",
    "push": "/push (HTTP/2 server push demo)",
    "health": "Direct database test available"
  },
  "http2Features": {
    "multiplexing": "Multiple requests over single connection",
    "headerCompression": "HPACK compression reduces overhead",
    "serverPush": "Server can push resources proactively",
    "binaryProtocol": "More efficient than text-based HTTP/1.1"
  }
}
```

### UserController (用户控制器)

**功能：** 处理用户信息请求，支持多种参数格式

**路由：** `/user`

**方法：**
- `GET /user?userId=xxx` - 通过查询参数获取用户信息
- `GET /user/:userId` - 通过路径参数获取用户信息

**特性：**
- 双重参数支持（查询参数 + 路径参数）
- HTTP/2 协议信息展示
- 请求格式识别
- 协议特性检测

**响应示例：**
```json
{
  "message": "Hello, john_doe!",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "status": "success",
  "version": "2.0.0 - HTTP/2 Enabled",
  "protocol": {
    "version": "2.0",
    "scheme": "https",
    "encrypted": true,
    "http2": true
  },
  "features": {
    "multiplexing": true,
    "headerCompression": true,
    "serverPush": true
  },
  "requestFormat": "query-parameter"
}
```

### PushController (推送控制器)

**功能：** HTTP/2 服务器推送功能演示

**路由：** `/push`

**方法：**
- `GET /push` - 演示 HTTP/2 服务器推送

**特性：**
- HTTP/2 服务器推送实现
- 推送资源管理
- 协议兼容性检查
- 推送状态反馈

**响应示例：**
```json
{
  "message": "Server push demonstration",
  "timestamp": "2024-01-13T10:30:00.000Z",
  "http2": true,
  "pushSupported": true
}
```

## 🛠️ NestJS 控制器概念

### 装饰器说明

#### @Controller()
```typescript
@Controller('user')  // 设置路由前缀
export class UserController {}
```

#### HTTP 方法装饰器
```typescript
@Get()           // GET 请求
@Post()          // POST 请求
@Put()           // PUT 请求
@Delete()        // DELETE 请求
@Patch()         // PATCH 请求
```

#### 参数装饰器
```typescript
@Param('id')         // 路径参数
@Query('search')     // 查询参数
@Body()              // 请求体
@Headers()           // 请求头
@Req()               // 请求对象
@Res()               // 响应对象
```

### 参数提取示例

```typescript
@Controller('api')
export class ExampleController {
  // 路径参数：GET /api/users/123
  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return { userId: id };
  }

  // 查询参数：GET /api/search?q=keyword&page=1
  @Get('search')
  search(
    @Query('q') query: string,
    @Query('page') page: number
  ) {
    return { query, page };
  }

  // 请求体：POST /api/users
  @Post('users')
  createUser(@Body() userData: CreateUserDto) {
    return userData;
  }

  // 请求头：GET /api/profile
  @Get('profile')
  getProfile(@Headers('authorization') auth: string) {
    return { auth };
  }
}
```

## 🔄 请求处理流程

### 1. 路由匹配
```
客户端请求 → NestJS 路由器 → 匹配控制器和方法
```

### 2. 参数解析
```
HTTP 请求 → 参数装饰器 → 提取和转换数据
```

### 3. 业务处理
```
控制器方法 → 调用服务层 → 执行业务逻辑
```

### 4. 响应返回
```
业务结果 → 序列化处理 → HTTP 响应
```

## 📊 HTTP/2 特性支持

### 协议检测
```typescript
const httpVersion = req.raw.httpVersion || 'unknown';
const isHTTP2 = httpVersion === '2.0' || (req as any).isHTTP2 || false;
```

### 服务器推送
```typescript
if (isHTTP2 && (req.raw as any).stream && (req.raw as any).stream.pushAllowed) {
  const pushStream = (req.raw as any).stream.pushStream({
    ':path': '/api/pushed-resource',
    ':method': 'GET'
  }, callback);
}
```

### 协议信息
```typescript
const protocol = {
  version: httpVersion,
  scheme: req.protocol,
  encrypted: req.protocol === 'https',
  http2: isHTTP2
};
```

## 🎨 响应格式规范

### 成功响应
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 具体数据
  },
  "timestamp": "2024-01-13T10:30:00.000Z"
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误描述",
  "error": {
    "code": "ERROR_CODE",
    "details": "详细错误信息"
  },
  "timestamp": "2024-01-13T10:30:00.000Z"
}
```

## 🧪 测试示例

### 控制器单元测试
```typescript
describe('HomeController', () => {
  let controller: HomeController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [HomeController],
    }).compile();

    controller = module.get<HomeController>(HomeController);
  });

  it('should return system info', async () => {
    const mockRequest = {
      raw: { httpVersion: '2.0' },
      protocol: 'https'
    };

    const result = await controller.index(mockRequest as any);
    
    expect(result.message).toContain('Welcome');
    expect(result.server.http2Enabled).toBe(true);
  });
});
```

### API 集成测试
```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/user?userId=test (GET)', () => {
    return request(app.getHttpServer())
      .get('/user?userId=test')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('Hello, test');
      });
  });
});
```

## 🚀 最佳实践

### 1. 控制器设计原则
- 保持控制器轻量化
- 业务逻辑放在服务层
- 统一错误处理
- 标准化响应格式

### 2. 参数验证
- 使用 DTO 进行类型检查
- 实施输入验证
- 处理边界情况
- 提供清晰的错误信息

### 3. 性能优化
- 避免阻塞操作
- 使用异步处理
- 合理使用缓存
- 优化数据库查询

### 4. 安全考虑
- 输入数据验证
- 输出数据过滤
- 防止注入攻击
- 实施访问控制

## 📚 相关文档

- [NestJS Controllers 文档](https://docs.nestjs.com/controllers)
- [HTTP/2 规范](https://tools.ietf.org/html/rfc7540)
- [Fastify 文档](https://www.fastify.io/)
- [TypeScript 装饰器](https://www.typescriptlang.org/docs/handbook/decorators.html)