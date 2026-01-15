# AI 聊天功能问题修复

## 问题 1: AI 助手连接不上

### 原因
服务器监听地址设置为 `127.0.0.1`，只能本地访问，无法通过局域网 IP 访问。

### 修复
修改 `nest/src/main.ts`，将监听地址改为 `0.0.0.0`：

```typescript
// 修改前
await app.listen(port, '127.0.0.1');

// 修改后
await app.listen(port, '0.0.0.0');
```

### 验证
1. 重启后端服务
2. 访问 AI 聊天页面
3. 发送消息，应该能正常连接

## 问题 2: 聊天界面联系人列表消失

### 原因
所有 API 服务都使用硬编码的 `https://localhost:7002`，在局域网环境下无法访问后端。

### 修复
修改以下文件，使用环境变量：

1. **nest-react/src/services/api.ts**
```typescript
// 修改前
baseURL: 'https://localhost:7002',

// 修改后
baseURL: process.env.REACT_APP_API_BASE_URL || 'https://localhost:7002',
```

2. **nest-react/src/services/imApi.ts**
```typescript
// 修改前
const API_BASE_URL = 'https://localhost:7002/api/im';

// 修改后
const API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL || 'https://localhost:7002'}/api/im`;
```

3. **nest-react/src/services/socketService.ts**
```typescript
// 修改前
const SOCKET_URL = 'https://localhost:7002';

// 修改后
const SOCKET_URL = process.env.REACT_APP_WS_URL || 'https://localhost:7002';
```

4. **nest-react/src/services/instrumentApi.ts**
```typescript
// 修改前
const API_BASE_URL = 'https://localhost:7002';

// 修改后
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7002';
```

### 环境变量配置
确保 `nest-react/.env.local` 文件包含正确的配置：

```env
REACT_APP_API_BASE_URL=https://192.168.1.199:7002
REACT_APP_WS_URL=https://192.168.1.199:7002
```

### 验证
1. 重启前端服务
2. 访问聊天页面
3. 联系人列表应该正常显示
4. 可以正常发送和接收消息

## 完整修复步骤

### 1. 停止服务
```bash
# 停止后端
Ctrl+C (在后端终端)

# 停止前端
Ctrl+C (在前端终端)
```

### 2. 重新启动后端
```bash
cd nest
pnpm run start:dev
```

### 3. 重新启动前端
```bash
cd nest-react
pnpm run start
```

### 4. 测试功能

#### 测试聊天功能
1. 访问 http://localhost:3000
2. 登录系统
3. 点击 "即时通讯"
4. 检查联系人列表是否显示
5. 选择一个联系人
6. 发送消息，验证能正常收发

#### 测试 AI 助手
1. 在 Dashboard 点击 "AI 助手"
2. 输入问题，例如："你好"
3. 点击发送
4. 应该看到流式响应（逐字显示）

## 注意事项

### Groq API Key
如果 AI 助手仍然无法工作，可能是 API Key 失效。需要：

1. 访问 https://console.groq.com
2. 生成新的 API Key
3. 更新 `nest/.env` 文件：
```env
GROQ_API_KEY=your_new_api_key_here
```
4. 重启后端服务

### 网络配置
确保：
- 防火墙允许 7002 端口
- 局域网内其他设备可以访问 192.168.1.199:7002
- SSL 证书对局域网 IP 有效（或使用自签名证书）

### 浏览器控制台
如果仍有问题，打开浏览器开发者工具（F12），查看：
- Console 标签：查看 JavaScript 错误
- Network 标签：查看 API 请求是否成功
- 检查请求的 URL 是否正确

## 常见错误

### 1. CORS 错误
```
Access to fetch at 'https://192.168.1.199:7002/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决**: 后端已配置 CORS 允许所有来源，重启后端即可。

### 2. SSL 证书错误
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**解决**: 
- 在浏览器中访问 https://192.168.1.199:7002
- 点击 "高级" → "继续访问"
- 接受自签名证书

### 3. 连接超时
```
Failed to fetch
```

**解决**:
- 检查后端是否正在运行
- 检查防火墙设置
- 确认 IP 地址正确

### 4. 401 未授权
```
Unauthorized
```

**解决**:
- 重新登录
- 检查 token 是否过期
- 清除浏览器缓存和 localStorage

## 验证清单

- [ ] 后端服务正常启动（监听 0.0.0.0:7002）
- [ ] 前端服务正常启动
- [ ] 环境变量配置正确
- [ ] 可以登录系统
- [ ] 聊天页面显示联系人列表
- [ ] 可以发送和接收消息
- [ ] AI 助手页面可以访问
- [ ] AI 助手可以发送消息
- [ ] AI 响应流式显示
- [ ] 浏览器控制台无错误

## 总结

所有修复已完成：
1. ✅ 后端监听地址改为 0.0.0.0
2. ✅ 所有前端 API 服务使用环境变量
3. ✅ 环境变量配置正确

重启服务后，两个问题都应该解决。
