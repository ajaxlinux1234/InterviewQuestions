# 生产服务器 WebSocket 修复步骤

## 🎯 问题根源

WebSocket 连接未到达 NestJS 后端，被 Nginx 阻止。需要正确配置 Nginx 的 Socket.IO 代理。

---

## 🚀 修复步骤（在生产服务器上执行）

### 步骤 1: 拉取最新代码

```bash
cd /root/apps/InterviewQuestions
git pull
```

### 步骤 2: 运行自动修复脚本

```bash
chmod +x fix-websocket.sh
./fix-websocket.sh
```

这会自动：

- ✅ 更新后端环境变量（NODE_ENV=production）
- ✅ 更新前端环境变量（VITE_WS_URL=http://47.94.128.228）
- ✅ 重新构建前端
- ✅ 重启后端服务

### 步骤 3: 更新 Nginx 配置（关键步骤）

#### 3.1 编辑 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/default
```

#### 3.2 在 http 块中添加（如果没有）

在文件顶部的 `http {` 块内添加：

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

#### 3.3 在 server 块中添加 Socket.IO 代理

找到 `server {` 块，添加以下 location：

```nginx
# Socket.IO WebSocket 代理（必须在其他 location 之前）
location /socket.io/ {
    proxy_pass http://localhost:7002/socket.io/;
    proxy_http_version 1.1;

    # WebSocket 升级头
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # 基本代理头
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # 超时设置
    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    # 禁用缓冲
    proxy_buffering off;
}
```

#### 3.4 确保 API 代理配置正确

```nginx
location /api/ {
    proxy_pass http://localhost:7002/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

#### 3.5 确保静态文件配置正确

```nginx
location / {
    root /root/apps/InterviewQuestions/nest-react/build;
    try_files $uri $uri/ /index.html;
}
```

### 步骤 4: 测试并重载 Nginx

```bash
# 测试配置
sudo nginx -t

# 如果测试通过，重载
sudo nginx -s reload
```

### 步骤 5: 验证修复

```bash
# 查看后端日志
pm2 logs nest-backend --lines 20
```

在浏览器中：

1. 访问 `http://47.94.128.228`
2. 清除缓存（Ctrl+Shift+Delete）
3. 重新登录
4. 打开开发者工具 → Network → WS
5. 应该能看到 WebSocket 连接成功

---

## 📋 完整的 Nginx 配置示例

参考 `nginx-websocket.conf` 文件，或使用以下完整配置：

```nginx
# 在 http 块中
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name 47.94.128.228;

    # Socket.IO WebSocket 代理
    location /socket.io/ {
        proxy_pass http://localhost:7002/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        proxy_buffering off;
    }

    # API 接口代理
    location /api/ {
        proxy_pass http://localhost:7002/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 前端静态文件
    location / {
        root /root/apps/InterviewQuestions/nest-react/build;
        try_files $uri $uri/ /index.html;
        add_header Access-Control-Allow-Origin *;
    }
}
```

---

## ✅ 验证清单

- [ ] 代码已拉取到最新版本
- [ ] 运行了 `fix-websocket.sh` 脚本
- [ ] Nginx 配置已更新（包含 map 和 /socket.io/ location）
- [ ] Nginx 配置测试通过（`nginx -t`）
- [ ] Nginx 已重载（`nginx -s reload`）
- [ ] 后端服务已重启（`pm2 restart nest-backend`）
- [ ] 浏览器缓存已清除
- [ ] WebSocket 连接成功（DevTools → Network → WS）
- [ ] 后端日志显示连接成功

---

## 🔍 故障排查

### 如果 WebSocket 仍然失败

1. **检查后端日志**:

```bash
pm2 logs nest-backend --lines 50
```

应该能看到 "客户端 xxx 尝试连接" 的日志

2. **检查 Nginx 错误日志**:

```bash
sudo tail -f /var/log/nginx/error.log
```

3. **测试后端直连**:

```bash
# 在服务器上测试
curl http://localhost:7002/

# 测试 Socket.IO 端点
curl http://localhost:7002/socket.io/
```

4. **检查防火墙**:

```bash
sudo ufw status
# 确保 80 和 7002 端口开放
```

5. **使用调试工具**:

```bash
# 检查 Token
node nest/debug-token.js "your_token_here"

# 检查环境
node nest/check-env.js
```

---

## 📞 需要帮助？

查看详细调试指南：`DEBUG_WEBSOCKET.md`
