# 源代码目录 (src)

这是 NestJS 应用的源代码根目录，包含了应用的所有核心功能模块和业务逻辑。

## 📁 目录结构总览

```
src/
├── auth/                     # 认证模块 - 用户认证和授权
│   ├── auth.controller.ts    # 认证控制器
│   ├── auth.service.ts       # 认证服务
│   ├── auth.guard.ts         # 认证守卫
│   ├── auth.module.ts        # 认证模块
│   └── README.md            # 认证模块文档
├── controllers/              # 控制器目录 - HTTP 请求处理
│   ├── home.controller.ts    # 首页控制器
│   ├── user.controller.ts    # 用户控制器
│   └── README.md            # 控制器文档
├── dto/                      # 数据传输对象 - API 接口定义
│   ├── auth.dto.ts          # 认证相关 DTO
│   └── README.md            # DTO 文档
├── entities/                 # 数据库实体 - ORM 映射
│   ├── user.entity.ts       # 用户实体
│   ├── user-token.entity.ts # 用户令牌实体
│   └── README.md            # 实体文档
├── services/                 # 服务目录 - 业务逻辑和数据访问
│   ├── database.service.ts  # 数据库服务
│   ├── redis.service.ts     # Redis 服务
│   └── README.md            # 服务文档
├── app.module.ts            # 应用根模块
├── main.ts                  # 应用入口文件
└── README.md               # 本文档
```

## 🏗️ 架构设计

### 分层架构
```
┌─────────────────────────────────────┐
│           Presentation Layer        │  ← Controllers (控制器层)
│         (HTTP Request/Response)     │
├─────────────────────────────────────┤
│            Business Layer           │  ← Services (业务逻辑层)
│         (Business Logic)            │
├─────────────────────────────────────┤
│           Data Access Layer         │  ← Repositories (数据访问层)
│         (Database Operations)       │
├─────────────────────────────────────┤
│            Data Layer               │  ← Entities (数据层)
│         (Database Tables)           │
└─────────────────────────────────────┘
```

### 模块化设计
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Auth Module   │    │  Core Module    │    │ Feature Module  │
│                 │    │                 │    │                 │
│ • Controller    │    │ • Controllers   │    │ • Controllers   │
│ • Service       │    │ • Services      │    │ • Services      │
│ • Guard         │    │ • Entities      │    │ • DTOs          │
│ • DTOs          │    │ • DTOs          │    │ • Entities      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   App Module    │
                    │  (Root Module)  │
                    └─────────────────┘
```

## 🎯 各目录职责

### 📂 auth/ - 认证模块
**职责：** 用户身份验证和授权管理
- **控制器：** 处理登录、注册、退出等 HTTP 请求
- **服务：** 实现认证业务逻辑，令牌管理
- **守卫：** 保护需要认证的路由
- **模块：** 配置认证相关的依赖注入

**核心功能：**
- 用户注册和登录
- JWT 令牌生成和验证
- 密码加密和验证
- 会话管理
- 权限控制

### 📂 controllers/ - 控制器目录
**职责：** HTTP 请求处理和路由管理
- **首页控制器：** 系统信息展示
- **用户控制器：** 用户信息查询
- **推送控制器：** HTTP/2 服务器推送演示

**核心功能：**
- 路由定义和管理
- 请求参数解析
- 响应数据格式化
- HTTP/2 协议支持

### 📂 dto/ - 数据传输对象
**职责：** API 接口数据结构定义
- **类型安全：** TypeScript 类型检查
- **数据验证：** 输入数据格式验证
- **API 文档：** 自动生成接口文档

**核心功能：**
- 请求体数据结构
- 响应体数据结构
- 查询参数结构
- 数据验证规则

### 📂 entities/ - 数据库实体
**职责：** 数据库表结构和 ORM 映射
- **用户实体：** 用户基本信息表
- **令牌实体：** 访问令牌管理表

**核心功能：**
- 数据库表映射
- 字段类型定义
- 关系映射配置
- 约束和索引定义

### 📂 services/ - 服务目录
**职责：** 业务逻辑实现和数据访问
- **数据库服务：** 原生 SQL 查询
- **Redis 服务：** 缓存操作管理

**核心功能：**
- 业务逻辑封装
- 数据访问抽象
- 第三方服务集成
- 系统监控和日志

## 🔄 数据流向

### 请求处理流程
```
HTTP Request
    ↓
Controller (路由匹配，参数解析)
    ↓
Guard (权限验证，用户识别)
    ↓
Service (业务逻辑处理)
    ↓
Repository (数据库操作)
    ↓
Entity (数据模型)
    ↓
Database (数据存储)
    ↓
Response (返回结果)
    ↓
HTTP Response
```

### 依赖注入流程
```
Module Registration
    ↓
Provider Creation
    ↓
Dependency Resolution
    ↓
Service Injection
    ↓
Component Usage
```

## 🛠️ 核心文件说明

### main.ts - 应用入口
```typescript
/**
 * 应用启动文件
 * - 创建 NestJS 应用实例
 * - 配置 HTTP/2.0 支持
 * - 设置 HTTPS/SSL 证书
 * - 启动服务器监听
 */
```

**主要功能：**
- Fastify 适配器配置
- SSL 证书加载
- CORS 中间件注册
- 服务器启动和监听

### app.module.ts - 根模块
```typescript
/**
 * 应用根模块
 * - 配置数据库连接
 * - 导入功能模块
 * - 注册全局服务
 * - 管理依赖注入
 */
```

**主要功能：**
- TypeORM 数据库配置
- 模块导入和组织
- 全局服务注册
- 依赖注入配置

## 🔧 技术栈集成

### 框架和库
- **NestJS**: 基于 TypeScript 的 Node.js 框架
- **Fastify**: 高性能 Web 服务器
- **TypeORM**: 对象关系映射库
- **ioredis**: Redis 客户端库

### 数据库
- **MySQL**: 主数据库，存储用户和令牌信息
- **Redis**: 缓存数据库，存储会话和临时数据

### 安全和认证
- **JWT**: JSON Web Token 认证
- **MD5**: 密码加密算法
- **CORS**: 跨域资源共享

### 开发工具
- **TypeScript**: 类型安全的 JavaScript
- **class-validator**: 数据验证库
- **class-transformer**: 数据转换库

## 📊 性能特性

### HTTP/2.0 支持
- **多路复用**: 单连接处理多个请求
- **头部压缩**: HPACK 压缩减少开销
- **服务器推送**: 主动推送资源
- **二进制协议**: 更高效的数据传输

### 数据库优化
- **连接池**: 管理数据库连接
- **索引优化**: 提高查询性能
- **查询缓存**: Redis 缓存热点数据
- **异步操作**: 非阻塞 I/O 操作

## 🔒 安全特性

### 认证安全
- **令牌认证**: Bearer Token 方式
- **密码加密**: MD5 哈希存储
- **会话管理**: 令牌状态跟踪
- **IP 记录**: 登录安全审计

### 数据安全
- **输入验证**: DTO 数据验证
- **SQL 注入防护**: ORM 参数化查询
- **CORS 配置**: 跨域请求控制
- **HTTPS 支持**: SSL/TLS 加密传输

## 🧪 测试策略

### 单元测试
- 服务层业务逻辑测试
- 控制器请求处理测试
- 实体关系映射测试
- 工具函数测试

### 集成测试
- API 接口端到端测试
- 数据库操作测试
- 认证流程测试
- 第三方服务集成测试

### 性能测试
- 并发请求测试
- 数据库查询性能测试
- 内存使用监控
- 响应时间测试

## 🚀 部署和运维

### 开发环境
```bash
npm run start:dev    # 开发模式，支持热重载
```

### 生产环境
```bash
npm run build       # 编译 TypeScript
npm run start:prod  # 生产模式启动
```

### 环境配置
```bash
# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=database_name

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# 应用配置
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## 📈 监控和日志

### 应用监控
- 服务器状态监控
- 数据库连接监控
- Redis 连接监控
- API 响应时间监控

### 日志记录
- 请求访问日志
- 错误异常日志
- 业务操作日志
- 安全审计日志

## 📚 学习资源

### 官方文档
- [NestJS 官方文档](https://nestjs.com/)
- [TypeORM 文档](https://typeorm.io/)
- [Fastify 文档](https://www.fastify.io/)

### 最佳实践
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [TypeScript 最佳实践](https://typescript-eslint.io/rules/)
- [API 设计指南](https://github.com/microsoft/api-guidelines)

### 相关技术
- [HTTP/2.0 规范](https://tools.ietf.org/html/rfc7540)
- [JWT 规范](https://tools.ietf.org/html/rfc7519)
- [REST API 设计](https://restfulapi.net/)

## 🤝 贡献指南

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 编写详细的注释
- 保持一致的命名风格

### 提交规范
- 使用语义化提交信息
- 包含测试用例
- 更新相关文档
- 通过所有检查

### 开发流程
1. Fork 项目仓库
2. 创建功能分支
3. 编写代码和测试
4. 提交变更
5. 创建 Pull Request