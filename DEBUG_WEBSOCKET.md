# WebSocket 连接问题调试指南

## 🚀 快速修复（一键脚本）

如果你在本地开发环境，运行以下命令自动修复配置问题：

```bash
chmod +x fix-websocket.sh
./fix-websocket.sh
```

这个脚本会自动：

1. 更新后端 `.env` 配置（NODE_ENV=production, FRONTEND_URL）
2. 更新前端 `.env.production` 配置（VITE_WS_URL）
3. 重新构建前端
4. 重启后端服务（如果使用 PM2）
5. 提供 Nginx 配置指导

**注意**: 脚本执行后，你仍需要手动更新服务器上的 Nginx 配置！

---

## ⚠️ 当前问题状态

**根本原因**: WebSocket 连接未到达 NestJS 后端，被 Nginx 阻止或错误路由

**症状**:

- 前端显示 "无效的认证令牌" 错误
- PM2 日志中没有任何 WebSocket 连接尝试记录
- HTTP API 调用正常工作
- Token 在数据库中有效

**解决方案**: 需要正确配置 Nginx 的 WebSocket 代理

---

## 🔍 问题诊断步骤

### 1. 检查后端日志

在服务器上查看实时日志：

```bash
pm2 logs nest-backend --lines 100
```

查找以下关键信息：

- `客户端 xxx 尝试连接`
- `Token from auth: 存在/不存在`
- `Token from header: 存在/不存在`
- `验证 Token: xxx...`
- `Token 不存在或已被撤销` / `Token 已过期` / `Token 验证成功`

### 2. 使用调试脚本检查 Token

**在服务器上执行：**

```bash
cd /path/to/nest

# 从前端获取 token（浏览器控制台执行）
# localStorage.getItem('token')

# 在服务器上检查 token
node debug-token.js "your_token_here"
```

这会显示：

- Token 是否存在于数据库
- Token 是否已撤销
- Token 是否已过期
- 关联的用户信息

### 3. 使用前端调试页面

访问: `http://47.94.128.228/debug`

这个页面会显示：

- 当前登录用户信息
- Token 内容和长度
- 环境变量配置
- 提供 Socket 连接测试按钮

### 4. 检查数据库

```bash
mysql -u root -p im_system
```

```sql
-- 查看最近的 tokens
SELECT
  id,
  user_id,
  LEFT(token, 30) as token_preview,
  is_revoked,
  expires_at,
  created_at,
  CASE
    WHEN expires_at > NOW() THEN '有效'
    ELSE '已过期'
  END as status
FROM user_tokens
ORDER BY created_at DESC
LIMIT 10;

-- 查看特定用户的 tokens
SELECT * FROM user_tokens WHERE user_id = 1;

-- 检查 is_revoked 字段类型
DESCRIBE user_tokens;
```

## 🚨 关键问题: Nginx WebSocket 配置

### 问题: WebSocket 连接未到达后端

**症状**:

- 前端报错 "无效的认证令牌"
- 后端 PM2 日志中没有任何连接尝试
- HTTP API 正常工作

**原因**: Nginx 没有正确代理 Socket.IO 的 WebSocket 连接

**Socket.IO 路径说明**:

- Socket.IO 使用 `/socket.io/` 路径（不是 `/im/`）
- 前端连接: `http://47.94.128.228/im` → Socket.IO 实际请求: `/socket.io/?EIO=4&transport=websocket`
- Nginx 必须正确代理 `/socket.io/` 路径

**解决步骤**:

1. **检查当前 Nginx 配置**:

```bash
sudo cat /etc/nginx/sites-available/default | grep -A 10 "location /socket.io"
```

2. **更新 Nginx 配置**:

参考 `nginx-websocket.conf` 文件，确保包含以下配置：

```nginx
# 在 http 块中添加（通常在文件顶部）
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name 47.94.128.228;

    # Socket.IO WebSocket 代理（关键配置）
    location /socket.io/ {
        proxy_pass http://localhost:7002/socket.io/;
        proxy_http_version 1.1;

        # WebSocket 升级头（必须）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # 基本代理头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 需要更长的超时时间
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;

        # 禁用缓冲
        proxy_buffering off;
    }

    # API 接口代理
    location /api/ {
        proxy_pass http://localhost:7002/;
        # ... 其他配置
    }

    # 前端静态文件
    location / {
        root /root/apps/InterviewQuestions/nest-react/build;
        try_files $uri $uri/ /index.html;
    }
}
```

3. **测试并重载 Nginx**:

```bash
# 测试配置
sudo nginx -t

# 如果测试通过，重载配置
sudo nginx -s reload
# 或
sudo systemctl reload nginx
```

4. **验证修复**:

```bash
# 查看后端日志，应该能看到连接尝试
pm2 logs nest-backend --lines 20

# 在浏览器中测试
# 打开 DevTools → Network → WS
# 应该能看到 WebSocket 连接成功
```

---

## 🐛 其他常见问题和解决方案

### 问题 1: Token 不存在

**症状**: 日志显示 "Token 不存在或已被撤销"

**原因**:

- 用户未登录或 token 已被删除
- 前端使用了旧的 token
- 数据库中的 token 被清理

**解决方案**:

```bash
# 1. 清除前端缓存，重新登录
# 在浏览器控制台执行:
localStorage.clear()
# 然后重新登录

# 2. 检查数据库中是否有该用户的 token
mysql -u root -p im_system -e "SELECT * FROM user_tokens WHERE user_id = YOUR_USER_ID;"
```

### 问题 2: Token 已过期

**症状**: 日志显示 "Token 已过期"

**原因**: Token 的 `expires_at` 时间已过

**解决方案**:

```bash
# 重新登录获取新 token
# 或者延长现有 token 的过期时间（仅用于调试）
mysql -u root -p im_system -e "UPDATE user_tokens SET expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE token = 'your_token';"
```

### 问题 3: Token 已撤销

**症状**: `is_revoked = 1`

**原因**: 用户退出登录或 token 被手动撤销

**解决方案**:

```bash
# 重新登录获取新 token
# 或者恢复 token（仅用于调试）
mysql -u root -p im_system -e "UPDATE user_tokens SET is_revoked = 0 WHERE token = 'your_token';"
```

### 问题 4: Token 传递失败

**症状**: 日志显示 "缺少 token"

**原因**: 前端没有正确传递 token

**检查**:

1. 打开浏览器开发者工具 → Network → WS
2. 查看 WebSocket 连接的 Headers
3. 确认 `auth.token` 或 `Authorization` header 存在

**解决方案**:

```javascript
// 在浏览器控制台检查
console.log("Token:", localStorage.getItem("token"));

// 手动测试连接
import { io } from "socket.io-client";
const socket = io("http://47.94.128.228/im", {
  auth: { token: localStorage.getItem("token") },
});
socket.on("connected", console.log);
socket.on("error", console.error);
```

### 问题 5: 环境变量配置错误

**症状**: WebSocket 连接被拒绝，CORS 错误

**检查**:

```bash
# 检查后端 .env 配置
cat nest/.env | grep FRONTEND_URL
cat nest/.env | grep NODE_ENV

# 检查前端 .env.production 配置
cat nest-react/.env.production | grep VITE_WS_URL
```

**解决方案**:

```bash
# 后端 nest/.env 应该包含:
FRONTEND_URL=http://47.94.128.228
NODE_ENV=production

# 前端 nest-react/.env.production 应该包含:
VITE_WS_URL=http://47.94.128.228

# 更新后需要:
# 1. 重新构建前端
cd nest-react && pnpm build

# 2. 重启后端
pm2 restart nest-backend
```

### 问题 6: 前端使用错误的 WebSocket URL

**症状**: 前端尝试连接到 `localhost:7002` 而不是生产域名

**原因**: `.env.production` 中 `VITE_WS_URL` 为空或错误

**解决方案**:

```bash
# 1. 更新 nest-react/.env.production
echo "VITE_WS_URL=http://47.94.128.228" >> nest-react/.env.production

# 2. 重新构建
cd nest-react
pnpm build

# 3. 在浏览器中清除缓存并刷新
```

## 📊 完整诊断流程

```bash
# 1. 查看后端日志
pm2 logs nest-backend --lines 50

# 2. 获取前端 token（浏览器控制台）
localStorage.getItem('token')

# 3. 在服务器上检查 token
node debug-token.js "paste_token_here"

# 4. 检查环境配置
cat .env | grep -E "FRONTEND_URL|NODE_ENV"

# 5. 检查数据库连接
mysql -u root -p im_system -e "SELECT COUNT(*) FROM user_tokens WHERE is_revoked = 0 AND expires_at > NOW();"

# 6. 测试 WebSocket 连接（使用 wscat）
npm install -g wscat
wscat -c "ws://localhost:7002/im" -H "Authorization: Bearer your_token"
```

## 🔧 临时调试配置

如果需要临时允许所有来源（仅用于调试）：

```typescript
// nest/src/gateways/im.gateway.ts
@WebSocketGateway({
  cors: {
    origin: '*',  // ⚠️ 仅用于调试，不要用于生产
    credentials: true,
  },
  namespace: "/im",
})
```

找到问题后，立即改回正确的配置！

## 📝 收集信息清单

如果问题仍未解决，请收集以下信息：

1. **后端日志**:

   ```bash
   pm2 logs nest-backend --lines 100 > backend-logs.txt
   ```

2. **Token 调试信息**:

   ```bash
   node debug-token.js "your_token" > token-debug.txt
   ```

3. **数据库状态**:

   ```bash
   mysql -u root -p im_system -e "SELECT * FROM user_tokens ORDER BY created_at DESC LIMIT 5;" > db-tokens.txt
   ```

4. **环境配置**:

   ```bash
   cat .env > env-config.txt
   ```

5. **浏览器控制台截图**: 包含 Network → WS 标签的内容
