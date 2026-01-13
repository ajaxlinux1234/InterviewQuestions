# 认证模块 (Auth Module)

认证模块是用户身份验证和授权的核心模块，提供完整的用户认证功能。

## 📁 目录结构

```
auth/
├── auth.controller.ts    # 认证控制器 - 处理认证相关的 HTTP 请求
├── auth.service.ts       # 认证服务 - 认证业务逻辑实现
├── auth.guard.ts         # 认证守卫 - 路由保护中间件
├── auth.module.ts        # 认证模块 - 模块配置和依赖注入
└── README.md            # 本文档
```

## 🔧 功能特性

### 用户注册
- 用户名唯一性验证
- 邮箱唯一性验证
- 密码 MD5 加密存储
- 自动时间戳管理

### 用户登录
- 用户名密码验证
- 访问令牌生成
- 登录信息记录（IP、User-Agent）
- 30天令牌有效期

### 令牌管理
- 随机令牌生成
- 令牌状态跟踪
- 过期时间控制
- 软删除机制

### 权限保护
- 路由级别保护
- 令牌自动验证
- 用户信息注入
- 异常处理

## 📋 API 接口

### POST /auth/register
用户注册接口

**请求体：**
```json
{
  "username": "john_doe",
  "password": "5d41402abc4b2a76b9719d911017c592", // MD5加密后的密码
  "email": "john@example.com"
}
```

**响应：**
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### POST /auth/login
用户登录接口

**请求体：**
```json
{
  "username": "john_doe",
  "password": "5d41402abc4b2a76b9719d911017c592" // MD5加密后的密码
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "a1b2c3d4e5f6...",
    "expires_at": "2024-02-13T10:30:00.000Z",
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com"
    }
  }
}
```

### POST /auth/logout
用户退出接口（需要认证）

**请求头：**
```
Authorization: Bearer a1b2c3d4e5f6...
```

**响应：**
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

### GET /auth/profile
获取用户信息接口（需要认证）

**请求头：**
```
Authorization: Bearer a1b2c3d4e5f6...
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-01-13T10:30:00.000Z"
  }
}
```

## 🛡️ 安全特性

### 密码安全
- 前端 MD5 加密传输
- 数据库不存储明文密码
- 密码字段命名规范

### 令牌安全
- 64位随机令牌生成
- 30天自动过期
- 软删除保留审计记录
- IP 和设备信息记录

### 访问控制
- Bearer Token 认证
- 路由级别保护
- 自动令牌验证
- 异常情况处理

## 🔄 使用流程

### 1. 用户注册
```typescript
// 前端发送注册请求
const response = await fetch('/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: md5('plain_password'),
    email: 'john@example.com'
  })
});
```

### 2. 用户登录
```typescript
// 前端发送登录请求
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'john_doe',
    password: md5('plain_password')
  })
});

// 保存令牌
const { token } = response.data;
localStorage.setItem('token', token);
```

### 3. 访问受保护资源
```typescript
// 在请求头中携带令牌
const response = await fetch('/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### 4. 用户退出
```typescript
// 发送退出请求
await fetch('/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});

// 清除本地令牌
localStorage.removeItem('token');
```

## 🏗️ 架构设计

### 控制器层 (Controller)
- 处理 HTTP 请求和响应
- 参数验证和数据转换
- 调用服务层处理业务逻辑
- 返回标准化响应格式

### 服务层 (Service)
- 实现核心业务逻辑
- 数据库操作和事务管理
- 令牌生成和验证
- 安全策略实施

### 守卫层 (Guard)
- 请求拦截和权限验证
- 令牌解析和用户识别
- 上下文信息注入
- 异常处理和响应

### 数据层 (Entity)
- 数据模型定义
- 数据库映射关系
- 字段约束和验证
- 关联关系管理

## 🔧 配置说明

### JWT 配置
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  signOptions: { expiresIn: '30d' }
})
```

### 数据库配置
```typescript
TypeOrmModule.forFeature([User, UserToken])
```

### 环境变量
```bash
JWT_SECRET=your-super-secret-key-here
```

## 🧪 测试建议

### 单元测试
- 服务方法测试
- 守卫逻辑测试
- 实体关系测试
- 异常情况测试

### 集成测试
- API 接口测试
- 数据库操作测试
- 认证流程测试
- 权限验证测试

### 安全测试
- 令牌伪造测试
- 过期令牌测试
- 权限绕过测试
- SQL 注入测试

## 📈 性能优化

### 数据库优化
- 令牌字段索引
- 用户查询优化
- 连接池配置
- 查询缓存

### 缓存策略
- 用户信息缓存
- 令牌状态缓存
- Redis 集成
- 缓存失效策略

### 并发处理
- 异步操作
- 连接池管理
- 请求限流
- 负载均衡

## 🚀 扩展功能

### 多因素认证
- 短信验证码
- 邮箱验证
- TOTP 支持
- 生物识别

### 社交登录
- OAuth 2.0 集成
- 第三方平台支持
- 账号绑定
- 信息同步

### 权限管理
- 角色基础访问控制 (RBAC)
- 权限继承
- 动态权限
- 资源级权限

## 📚 相关文档

- [NestJS Guards 文档](https://docs.nestjs.com/guards)
- [TypeORM 实体文档](https://typeorm.io/entities)
- [JWT 规范](https://tools.ietf.org/html/rfc7519)
- [OAuth 2.0 规范](https://tools.ietf.org/html/rfc6749)