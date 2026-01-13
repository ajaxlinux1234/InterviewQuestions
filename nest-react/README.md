# NestJS + React 认证系统

这是一个现代化的全栈认证系统，使用 NestJS (HTTP/2) 作为后端，React 18 + TypeScript 作为前端。

## 🚀 技术栈

### 后端 (NestJS)
- **NestJS 11.x** - 现代化的 Node.js 框架
- **HTTP/2** - 高性能协议支持
- **TypeORM** - 数据库 ORM
- **MySQL** - 关系型数据库
- **Redis** - 缓存和会话存储
- **JWT** - Token 认证

### 前端 (React)
- **React 19** - 最新版本的 React
- **TypeScript** - 类型安全
- **React Router v7** - 路由管理
- **TanStack Query** - 数据获取和缓存
- **Zustand** - 状态管理
- **React Hook Form** - 表单处理
- **Zod** - 数据验证
- **Tailwind CSS** - 样式框架
- **Lucide React** - 图标库

## 🔐 功能特性

### 认证功能
- ✅ 用户注册
- ✅ 用户登录 (MD5 密码加密)
- ✅ 自动登录状态保持
- ✅ 安全退出登录
- ✅ Token 自动刷新
- ✅ 路由保护

### 安全特性
- ✅ HTTPS + HTTP/2 通信
- ✅ MD5 密码加密
- ✅ JWT Token 认证
- ✅ 30天 Token 过期时间
- ✅ 自动 Token 撤销
- ✅ CORS 跨域支持

### 用户体验
- ✅ 响应式设计
- ✅ 实时表单验证
- ✅ 加载状态指示
- ✅ 错误提示
- ✅ 成功通知
- ✅ 密码可见性切换

## 🛠️ 开发环境

### 前置要求
- Node.js 16+
- MySQL 8.0+
- Redis (可选)

### 启动后端服务
```bash
cd nest
pnpm install
pnpm run build
pnpm run start:prod
```

后端服务将运行在: `https://localhost:7002`

### 启动前端应用
```bash
cd nest-react
npm install
npm start
```

前端应用将运行在: `http://localhost:3000`

## 📱 使用说明

1. **访问应用**: 打开浏览器访问 `http://localhost:3000`
2. **注册账户**: 点击"立即注册"创建新账户
3. **登录系统**: 使用用户名和密码登录
4. **查看仪表板**: 登录后查看用户信息和系统状态
5. **安全退出**: 点击"退出登录"安全退出系统

## 🔧 API 端点

### 认证相关
- `POST /auth/register` - 用户注册
- `POST /auth/login` - 用户登录
- `GET /auth/profile` - 获取用户信息
- `POST /auth/logout` - 退出登录

### 其他功能
- `GET /` - 系统首页
- `GET /user` - 用户信息 (支持查询参数和路径参数)
- `GET /push` - HTTP/2 服务器推送演示

## 🎨 界面预览

- **登录页面**: 简洁的登录表单，支持密码可见性切换
- **注册页面**: 完整的注册表单，包含邮箱验证和密码确认
- **仪表板**: 用户信息展示，系统状态监控

## 🔒 安全说明

1. **密码加密**: 前端使用 MD5 加密密码后传输
2. **HTTPS 通信**: 所有 API 请求都通过 HTTPS 加密
3. **Token 管理**: JWT Token 存储在 localStorage，自动过期
4. **路由保护**: 未登录用户自动重定向到登录页面

## 📝 开发注意事项

1. **自签名证书**: 开发环境使用自签名证书，浏览器可能显示安全警告
2. **CORS 配置**: 后端已配置 CORS 允许前端跨域访问
3. **数据库配置**: 确保 MySQL 数据库已创建并配置正确
4. **环境变量**: 可通过环境变量配置数据库连接信息

## 🚀 部署建议

1. **生产环境**: 使用真实的 SSL 证书
2. **数据库**: 配置生产级别的 MySQL 实例
3. **缓存**: 启用 Redis 缓存提升性能
4. **监控**: 添加应用监控和日志记录
5. **备份**: 定期备份数据库数据

---

**开发者**: 基于 NestJS + React 技术栈构建的现代化认证系统