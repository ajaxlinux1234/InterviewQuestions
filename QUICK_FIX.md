# 快速修复指南

## 问题原因

1. **AiModule 配置冲突**: `ConfigModule` 和 `ThrottlerModule` 在 `AiModule` 中重复配置，导致模块冲突，后端无法启动
2. **API 地址硬编码**: 前端所有 API 服务都硬编码了 `localhost:7002`，无法使用局域网 IP

## 已修复

### 后端修复
1. ✅ 移除 `AiModule` 中的 `ConfigModule` 和 `ThrottlerModule`
2. ✅ 在 `AppModule` 中添加全局 `ConfigModule` 和 `ThrottlerModule`
3. ✅ 修改服务器监听地址为 `0.0.0.0`

### 前端修复
1. ✅ 所有 API 服务改用环境变量
2. ✅ `api.ts` - 使用 `REACT_APP_API_BASE_URL`
3. ✅ `imApi.ts` - 使用 `REACT_APP_API_BASE_URL`
4. ✅ `socketService.ts` - 使用 `REACT_APP_WS_URL`
5. ✅ `instrumentApi.ts` - 使用 `REACT_APP_API_BASE_URL`
6. ✅ `sseService.ts` - 使用 `REACT_APP_API_BASE_URL`

## 🚀 立即重启服务

### 1. 停止所有服务
```bash
# 在后端终端按 Ctrl+C
# 在前端终端按 Ctrl+C
```

### 2. 重启后端
```bash
cd nest
pnpm run start:dev
```

**等待看到以下输出**:
```
✅ NestJS 应用已就绪，HTTP/2.0 支持已启用
🌐 服务器运行在: https://0.0.0.0:7002
```

### 3. 验证后端启动
```bash
# 新开一个终端
lsof -i :7002
```

应该看到 node 进程在监听 7002 端口。

### 4. 重启前端
```bash
cd nest-react
pnpm run start
```

## ✅ 测试步骤

### 测试 1: 聊天功能
1. 访问 http://localhost:3000
2. 登录系统
3. 点击 "即时通讯"
4. **应该看到联系人列表** ✅
5. 选择联系人，发送消息
6. **应该能正常收发消息** ✅

### 测试 2: AI 助手
1. 在 Dashboard 点击 "AI 助手"
2. 输入："你好"
3. 点击发送
4. **应该看到连接成功** ✅
5. **应该看到流式响应（逐字显示）** ✅

## 🔍 故障排除

### 如果后端无法启动

1. **检查端口占用**:
```bash
lsof -i :7002
# 如果有其他进程占用，kill 掉
kill -9 <PID>
```

2. **检查编译错误**:
```bash
cd nest
pnpm run build
```

3. **查看详细日志**:
```bash
cd nest
pnpm run start:dev
# 查看完整输出
```

### 如果前端无法连接

1. **检查环境变量**:
```bash
cat nest-react/.env.local
```

应该包含:
```env
REACT_APP_API_BASE_URL=https://192.168.1.199:7002
REACT_APP_WS_URL=https://192.168.1.199:7002
```

2. **清除浏览器缓存**:
- 打开开发者工具 (F12)
- 右键点击刷新按钮
- 选择 "清空缓存并硬性重新加载"

3. **检查网络请求**:
- 打开开发者工具 (F12)
- 切换到 Network 标签
- 查看请求的 URL 是否正确
- 查看响应状态码

### 如果 AI 助手仍然无法工作

可能是 Groq API Key 失效：

1. 访问 https://console.groq.com
2. 生成新的 API Key
3. 更新 `nest/.env`:
```env
GROQ_API_KEY=your_new_api_key_here
```
4. 重启后端服务

## 📝 验证清单

- [ ] 后端服务成功启动（看到 "NestJS 应用已就绪"）
- [ ] 端口 7002 正在监听（`lsof -i :7002` 有输出）
- [ ] 前端服务成功启动
- [ ] 可以登录系统
- [ ] 聊天页面显示联系人列表
- [ ] 可以发送和接收消息
- [ ] AI 助手页面可以访问
- [ ] AI 助手可以发送消息
- [ ] AI 响应流式显示
- [ ] 浏览器控制台无错误

## 🎯 关键修复点

### 修复前的问题
```typescript
// AiModule - 错误：重复配置
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ❌ 重复
    ThrottlerModule.forRootAsync(...),         // ❌ 重复
    TypeOrmModule.forFeature([...]),
  ],
})
```

### 修复后
```typescript
// AiModule - 正确：只配置自己需要的
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, AiRequestLog]),  // ✅ 只配置实体
  ],
})

// AppModule - 正确：全局配置
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // ✅ 全局配置
    ThrottlerModule.forRoot([...]),            // ✅ 全局配置
    TypeOrmModule.forRoot({...}),
    AiModule,  // ✅ 导入 AiModule
  ],
})
```

## 💡 重要提示

1. **ConfigModule** 和 **ThrottlerModule** 应该只在 **AppModule** 中配置一次
2. 子模块（如 AiModule）只需要导入自己特定的依赖
3. 使用 `isGlobal: true` 可以让 ConfigModule 在所有模块中可用
4. 环境变量文件应该是 `.env`（后端）和 `.env.local`（前端）

## 📞 如果还有问题

1. 检查后端终端的完整输出
2. 检查前端浏览器控制台的错误信息
3. 确认网络配置（防火墙、IP 地址）
4. 尝试使用 `localhost` 而不是局域网 IP 测试

---

**修复完成时间**: 2026-01-15
**状态**: ✅ 所有问题已修复，等待重启验证
