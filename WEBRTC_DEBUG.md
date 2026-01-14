# WebRTC 通话调试指南

## 问题修复记录

### 问题 1: 被邀请用户为 undefined
**原因**: 前端发送的参数名与后端期望不匹配
- 前端发送: `{ toUserId, ... }`
- 后端期望: `{ targetUserId, ... }`

**解决方案**: 修改 `socketService.ts` 中所有 WebRTC 方法的参数名

### 问题 2: 被邀请方收到 socket 但不显示弹窗
**原因**: WebRTC 监听器注册时机问题
- `webrtcService` 在模块加载时就尝试注册监听器
- 此时 `socketService` 可能还没连接

**解决方案**: 
1. 移除构造函数中的自动初始化
2. 添加 `init()` 方法，在 socket 连接后手动调用
3. 添加 `isInitialized` 标志防止重复初始化
4. 在 ChatPage 的 socket 连接后调用 `webrtcService.init()`

## 调试步骤

### 1. 检查 Socket 连接
打开浏览器控制台，应该看到：
```
Socket 连接成功: { userId: X, socketId: "..." }
初始化 WebRTC 服务，注册 Socket 监听器
注册 WebRTC 状态变化监听器
```

### 2. 发起通话
用户 A 点击语音/视频通话按钮，控制台应显示：
```
发起通话: { targetUserId: Y, conversationId: Z, callType: "audio/video" }
```

### 3. 接收通话邀请
用户 B 的控制台应显示：
```
=== WebRTC: 收到通话邀请 ===
邀请数据: { callerId: X, conversationId: Z, callType: "audio/video" }
当前状态: idle
更新后状态: { status: "ringing", callType: "audio/video", ... }
是否有状态变化回调: true
=== 状态变化通知已发送 ===
=== WebRTC 状态变化 === { status: "ringing", ... }
显示通话模态框
```

### 4. 检查通话模态框
用户 B 应该看到通话模态框，显示：
- 通话类型（语音/视频通话）
- 状态文本："收到通话邀请"
- 接受和拒绝按钮

## 常见问题排查

### 问题: 收不到通话邀请
**检查项**:
1. Socket 是否连接成功？
2. `webrtcService.init()` 是否被调用？
3. 浏览器控制台是否有错误？
4. Network 标签中是否看到 `callInvite` socket 消息？

### 问题: 收到邀请但不显示弹窗
**检查项**:
1. 控制台是否显示 "=== WebRTC: 收到通话邀请 ==="？
2. "是否有状态变化回调" 是否为 true？
3. 是否显示 "=== WebRTC 状态变化 ==="？
4. `showCallModal` 状态是否更新？

### 问题: 接受通话后没有音视频
**检查项**:
1. 浏览器是否授予麦克风/摄像头权限？
2. 是否在 HTTPS 环境下（localhost 除外）？
3. WebRTC Offer/Answer/ICE 消息是否正常交换？
4. 控制台是否有 WebRTC 相关错误？

## 测试流程

### 准备工作
1. 启动后端: `cd nest && pnpm start:dev`
2. 启动前端: `cd nest-react && pnpm start`
3. 打开两个浏览器窗口（或使用隐身模式）
4. 分别登录不同账号（用户 A 和用户 B）

### 测试语音通话
1. 用户 A 打开与用户 B 的私聊
2. 点击语音通话按钮（电话图标）
3. 检查用户 A 控制台日志
4. 检查用户 B 是否收到邀请弹窗
5. 用户 B 点击"接受"
6. 检查双方是否建立音频连接
7. 测试静音功能
8. 测试挂断功能

### 测试视频通话
1. 用户 A 打开与用户 B 的私聊
2. 点击视频通话按钮（摄像头图标）
3. 检查用户 A 控制台日志
4. 检查用户 B 是否收到邀请弹窗
5. 用户 B 点击"接受"
6. 检查双方是否能看到视频
7. 测试静音功能
8. 测试关闭摄像头功能
9. 测试挂断功能

### 测试拒绝通话
1. 用户 A 发起通话
2. 用户 B 点击"拒绝"
3. 检查用户 A 是否收到拒绝提示
4. 检查双方通话模态框是否关闭

## 代码修改总结

### 修改的文件
1. `nest-react/src/services/socketService.ts`
   - 修复所有 WebRTC 方法的参数名

2. `nest-react/src/services/webrtcService.ts`
   - 移除构造函数自动初始化
   - 添加 `init()` 方法
   - 添加 `isInitialized` 标志
   - 增强日志输出

3. `nest-react/src/pages/ChatPage.tsx`
   - 在 socket 连接后调用 `webrtcService.init()`
   - 增强状态变化监听器的日志

## 下一步优化建议

1. **添加来电铃声**: 收到邀请时播放铃声
2. **显示对方信息**: 在通话模态框中显示对方用户名和头像
3. **通话历史**: 记录通话历史（时长、时间等）
4. **网络质量指示**: 显示连接质量和延迟
5. **错误处理**: 更友好的错误提示（权限被拒绝、连接失败等）
6. **重连机制**: 通话中断后自动重连
7. **群组通话**: 支持多人音视频会议
8. **屏幕共享**: 添加屏幕共享功能

## 完成时间
2026-01-14
