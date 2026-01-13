# NestJS HTTP/2.0 认证系统

这是一个基于 NestJS 框架构建的现代化 Web 应用，支持 HTTP/2.0 协议和完整的用户认证系统。

## 🚀 项目特性

- **HTTP/2.0 支持**: 使用 Fastify 适配器实现高性能 HTTP/2.0 服务
- **用户认证系统**: 完整的注册、登录、退出、权限验证功能
- **数据库集成**: 使用 TypeORM + MySQL 进行数据持久化
- **Redis 缓存**: 集成 Redis 用于缓存和会话管理
- **安全性**: MD5 密码加密、JWT 令牌认证、IP 记录
- **TypeScript**: 全面的类型安全和现代 JavaScript 特性

## 📁 项目结构

```
nest/
├── src/                          # 源代码目录
│   ├── auth/                     # 认证模块
│   │   ├── auth.controller.ts    # 认证控制器 - 处理认证相关的 HTTP 请求
│   │   ├── auth.service.ts       # 认证服务 - 认证业务逻辑
│   │   ├── auth.guard.ts         # 认证守卫 - 路由保护中间件
│   │   └── auth.module.ts        # 认证模块 - 模块配置和依赖注入
│   ├── controllers/              # 控制器目录
│   │   ├── home.controller.ts    # 首页控制器 - 处理首页和系统信息
│   │   └── user.controller.ts    # 用户控制器 - 用户信息和 HTTP/2 演示
│   ├── dto/                      # 数据传输对象
│   │   └── auth.dto.ts           # 认证相关的 DTO 类型定义
│   ├── entities/                 # 数据库实体
│   │   ├── user.entity.ts        # 用户实体 - 对应 users 表
│   │   └── user-token.entity.ts  # 用户令牌实体 - 对应 user_tokens 表
│   ├── services/                 # 服务目录
│   │   ├── database.service.ts   # 数据库服务 - 原生 SQL 查询
│   │   └── redis.service.ts      # Redis 服务 - 缓存操作
│   ├── app.module.ts             # 应用根模块 - 全局配置和模块导入
│   └── main.ts                   # 应用入口文件 - 启动配置和服务器设置
├── database/                     # 数据库相关文件
│   ├── user_auth.sql             # 数据库表结构 SQL
│   └── design_explanation.md    # 数据库设计说明
├── certs/                        # SSL 证书目录
│   ├── cert.pem                  # SSL 证书文件
│   └── key.pem                   # SSL 私钥文件
├── dist/                         # 编译输出目录
├── node_modules/                 # 依赖包目录
├── package.json                  # 项目配置和依赖
├── tsconfig.json                 # TypeScript 配置
└── nest-cli.json                 # NestJS CLI 配置
```

## 🛠 技术栈

### 核心框架
- **NestJS**: 基于 TypeScript 的 Node.js 框架
- **Fastify**: 高性能 Web 服务器（支持 HTTP/2.0）
- **TypeScript**: 类型安全的 JavaScript 超集

### 数据库和 ORM
- **MySQL**: 关系型数据库
- **TypeORM**: TypeScript ORM 库
- **Redis**: 内存数据库（缓存）

### 认证和安全
- **JWT**: JSON Web Token 认证
- **MD5**: 密码加密
- **CORS**: 跨域资源共享

## 📋 API 接口

### 认证接口
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `POST /auth/logout` - 用户退出（需要认证）
- `GET /auth/profile` - 获取用户信息（需要认证）

### 系统接口
- `GET /` - 系统首页和信息
- `GET /user?userId=xxx` - 获取用户信息（查询参数）
- `GET /user/:userId` - 获取用户信息（路径参数）
- `GET /push` - HTTP/2.0 服务器推送演示

## 🔧 环境配置

### 环境变量
```bash
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=im_service

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT 配置
JWT_SECRET=your-secret-key
```

### 数据库设置
1. 创建 MySQL 数据库
2. 执行 `database/user_auth.sql` 创建表结构
3. 配置数据库连接参数

### SSL 证书（可选）
1. 将 SSL 证书文件放在 `certs/` 目录
2. 证书文件名：`cert.pem` 和 `key.pem`
3. 有证书时自动启用 HTTPS 和 HTTP/2.0

## 🚀 启动项目

### 开发模式
```bash
npm run start:dev
```

### 生产模式
```bash
npm run build
npm run start:prod
```

## 📖 NestJS 核心概念

### 1. 模块 (Modules)
- 使用 `@Module()` 装饰器定义
- 组织相关功能的容器
- 管理依赖注入和导入导出

### 2. 控制器 (Controllers)
- 使用 `@Controller()` 装饰器定义
- 处理 HTTP 请求和响应
- 定义路由和请求方法

### 3. 服务 (Services)
- 使用 `@Injectable()` 装饰器定义
- 包含业务逻辑
- 通过依赖注入使用

### 4. 守卫 (Guards)
- 实现 `CanActivate` 接口
- 用于路由保护和权限验证
- 在请求处理前执行

### 5. 实体 (Entities)
- 使用 TypeORM 装饰器定义
- 对应数据库表结构
- 提供类型安全的数据访问

### 6. DTO (Data Transfer Objects)
- 定义数据传输格式
- 提供类型检查和验证
- 用于 API 接口的输入输出

## 🔒 安全特性

1. **密码安全**: 前端 MD5 加密后传输
2. **令牌认证**: JWT 令牌有效期 30 天
3. **会话管理**: 数据库存储令牌状态
4. **IP 记录**: 记录登录 IP 和 User-Agent
5. **CORS 配置**: 跨域请求控制

## 📊 性能优化

1. **HTTP/2.0**: 多路复用、头部压缩、服务器推送
2. **Fastify**: 比 Express 更高的性能
3. **连接池**: 数据库连接池管理
4. **Redis 缓存**: 减少数据库查询
5. **TypeScript**: 编译时优化

## 🐛 调试和日志

- 控制台输出详细的启动信息
- 数据库连接状态监控
- Redis 连接状态监控
- HTTP 请求日志记录

## 📚 学习资源

- [NestJS 官方文档](https://nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Fastify 文档](https://www.fastify.io/)
- [HTTP/2.0 规范](https://tools.ietf.org/html/rfc7540)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License