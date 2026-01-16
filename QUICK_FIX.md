# WebSocket 问题快速修复指南

## 🚀 在生产服务器上执行（5 分钟）

### 1️⃣ 拉取代码并运行修复脚本

```bash
cd /root/apps/InterviewQuestions
git pull
chmod +x fix-websocket.sh
./fix-websocket.sh
```

### 2️⃣ 更新 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/default
```

**在 http 块中添加**（文件顶部）:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

**在 server 块中添加**（在其他 location 之前）:

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

### 3️⃣ 重载 Nginx

```bash
sudo nginx -t && sudo nginx -s reload
```

### 4️⃣ 验证

```bash
pm2 logs nest-backend --lines 20
```

应该看到: `客户端 xxx 尝试连接` 和 `用户 x 通过 socket xxx 连接成功`

---

## ✅ 完成！

在浏览器中:

1. 清除缓存 (Ctrl+Shift+Delete)
2. 访问 http://47.94.128.228
3. 重新登录
4. WebSocket 应该正常工作

---

## 🆘 如果还有问题

查看详细文档:

- `PRODUCTION_FIX_STEPS.md` - 详细步骤
- `DEBUG_WEBSOCKET.md` - 调试指南
- `nginx-websocket.conf` - 完整 Nginx 配置示例
