# WebSocket 认证问题调试指南

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

## 🐛 常见问题和解决方案

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

### 问题 5: CORS 问题

**症状**: WebSocket 连接被拒绝，浏览器控制台显示 CORS 错误

**检查**:

```bash
# 检查 .env 配置
cat /path/to/nest/.env | grep FRONTEND_URL
cat /path/to/nest/.env | grep NODE_ENV
```

**解决方案**:

```bash
# 确保 .env 中有正确配置
FRONTEND_URL=http://47.94.128.228
NODE_ENV=production

# 重启应用
pm2 restart nest-backend
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
