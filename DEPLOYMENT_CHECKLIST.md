# 生产环境部署检查清单

## 📋 部署前检查

### 1. 环境变量配置

#### 后端 (`nest/.env`)

```bash
# 必须配置
NODE_ENV=production
FRONTEND_URL=http://47.94.128.228

# 数据库配置
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=im_system

# AI 配置（如果使用）
GROQ_API_KEY=your_api_key
GROQ_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
GROQ_MODEL=qwen-plus
```

#### 前端 (`nest-react/.env.production`)

```bash
# API 地址（使用相对路径）
VITE_API_BASE_URL=/api

# WebSocket 地址（使用实际域名）
VITE_WS_URL=http://47.94.128.228
```

### 2. 数据库迁移

```bash
# 检查数据库架构
mysql -u root -p im_system < nest/database/init-database.sql

# 如果需要迁移
mysql -u root -p im_system < nest/database/migrate-schema.sql
```

### 3. 构建应用

```bash
# 后端构建
cd nest
pnpm install
pnpm build

# 前端构建
cd ../nest-react
pnpm install
pnpm build
```

### 4. Nginx 配置

**关键配置点**:

1. **WebSocket 升级映射**（在 http 块中）:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

2. **Socket.IO 代理**（在 server 块中）:

```nginx
location /socket.io/ {
    proxy_pass http://localhost:7002/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;
    proxy_buffering off;
}
```

3. **API 代理**:

```nginx
location /api/ {
    proxy_pass http://localhost:7002/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

4. **静态文件**:

```nginx
location / {
    root /root/apps/InterviewQuestions/nest-react/build;
    try_files $uri $uri/ /index.html;
}
```

**测试并重载**:

```bash
sudo nginx -t
sudo nginx -s reload
```

### 5. 启动服务

```bash
# 使用 PM2 启动后端
cd nest
pm2 start dist/main.js --name nest-backend

# 或重启现有进程
pm2 restart nest-backend

# 查看日志
pm2 logs nest-backend
```

---

## ✅ 部署后验证

### 1. 检查后端服务

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs nest-backend --lines 50

# 测试 API
curl http://localhost:7002/
```

### 2. 检查前端访问

```bash
# 访问首页
curl http://47.94.128.228/

# 检查静态文件
ls -la /root/apps/InterviewQuestions/nest-react/build
```

### 3. 测试 WebSocket 连接

在浏览器中：

1. 打开 `http://47.94.128.228`
2. 登录系统
3. 打开开发者工具 → Network → WS
4. 应该能看到 WebSocket 连接成功

### 4. 检查日志

```bash
# 后端日志应该显示
pm2 logs nest-backend | grep "客户端.*连接"

# 应该能看到类似输出:
# 客户端 xxx 尝试连接
# Token from auth: 存在
# 用户 1 通过 socket xxx 连接成功
```

---

## 🔧 常见部署问题

### WebSocket 连接失败

**症状**: 前端显示 "无效的认证令牌"，但 HTTP API 正常

**检查**:

1. Nginx 是否正确配置 `/socket.io/` 代理
2. `VITE_WS_URL` 是否设置为正确的域名
3. `NODE_ENV` 是否设置为 `production`
4. 前端是否重新构建

**解决**: 运行 `./fix-websocket.sh` 脚本

### CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**检查**:

1. `FRONTEND_URL` 是否正确
2. `NODE_ENV` 是否为 `production`

**解决**:

```bash
# 更新 nest/.env
FRONTEND_URL=http://47.94.128.228
NODE_ENV=production

# 重启服务
pm2 restart nest-backend
```

### 数据库连接失败

**症状**: 后端日志显示数据库错误

**检查**:

1. 数据库是否运行
2. 数据库凭据是否正确
3. 数据库架构是否最新

**解决**:

```bash
# 检查数据库
mysql -u root -p -e "SHOW DATABASES;"

# 运行迁移
mysql -u root -p im_system < nest/database/migrate-schema.sql
```

### 静态文件 404

**症状**: 访问网站显示 404

**检查**:

1. 前端是否构建
2. Nginx root 路径是否正确

**解决**:

```bash
# 重新构建前端
cd nest-react
pnpm build

# 检查构建产物
ls -la build/

# 更新 Nginx 配置中的 root 路径
```

---

## 📝 快速命令参考

```bash
# 一键修复配置
./fix-websocket.sh

# 重新部署
cd nest && pnpm build && pm2 restart nest-backend
cd ../nest-react && pnpm build

# 查看日志
pm2 logs nest-backend --lines 100

# 测试 Nginx
sudo nginx -t
sudo nginx -s reload

# 数据库操作
mysql -u root -p im_system
```

---

## 🆘 需要帮助？

如果遇到问题，请查看：

- `DEBUG_WEBSOCKET.md` - WebSocket 问题详细调试指南
- `nginx-websocket.conf` - Nginx 配置参考
- 运行 `node nest/debug-token.js <token>` 检查 Token
- 运行 `node nest/check-env.js` 检查环境配置
