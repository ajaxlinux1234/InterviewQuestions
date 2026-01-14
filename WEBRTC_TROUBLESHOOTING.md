# WebRTC 通话问题排查指南

## 当前问题
接收方收到 `callInvite` socket 消息，但前端没有显示通话弹窗。

## 已添加的调试日志

### 1. WebRTC 服务初始化
```
初始化 WebRTC 服务，注册 Socket 监听器
```
或
```
WebRTC 服务已初始化，跳过重复初始化
```

### 2. 状态变化监听器注册
```
=== 注册 WebRTC 状态变化监听器 ===
当前 showCallModal 状态: false
=== WebRTC 状态变化监听器注册完成 ===
```

### 3. 收到通话邀请
```
=== WebRTC: 收到通话邀请 ===
邀请数据: { callerId: X, conversationId: Y, callType: "audio/video" }
当前状态: idle
更新后状态: { status: "ringing", callType: "audio/video", ... }
是否有状态变化回调: true
=== 状态变化通知已发送 ===
```

### 4. 状态变化回调触发
```
=== WebRTC 状态变化回调被触发 ===
新状态: { status: "ringing", ... }
当前 showCallModal: false
准备显示通话模态框, 调用 setShowCallModal(true)
setShowCallModal(true) 已调用
```

### 5. React 状态更新
```
>>> showCallModal 状态变化: true
```

## 排查步骤

### 步骤 1: 检查 WebRTC 服务是否初始化
**期望日志**: `初始化 WebRTC 服务，注册 Socket 监听器`

**如果没有看到**:
- 检查 socket 是否连接成功
- 检查 ChatPage 组件是否正确渲染
- 检查 useEffect 是否执行

### 步骤 2: 检查状态变化监听器是否注册
**期望日志**: `=== 注册 WebRTC 状态变化监听器 ===`

**如果没有看到**:
- 检查 useEffect 的执行顺序
- 检查是否有 JavaScript 错误阻止执行

### 步骤 3: 检查是否收到通话邀请
**期望日志**: `=== WebRTC: 收到通话邀请 ===`

**如果没有看到**:
- 检查 Network 标签，确认 socket 消息已接收
- 检查 socket 监听器是否正确注册
- 检查事件名称是否匹配（`callInvite`）

### 步骤 4: 检查状态变化回调是否触发
**期望日志**: `=== WebRTC 状态变化回调被触发 ===`

**如果没有看到**:
- 检查 `onStateChangeCallback` 是否为 null
- 检查 `notifyStateChange()` 是否被调用
- 检查是否有 JavaScript 错误

### 步骤 5: 检查 React 状态是否更新
**期望日志**: `>>> showCallModal 状态变化: true`

**如果没有看到**:
- 检查 `setShowCallModal` 是否被正确调用
- 检查是否有闭包问题
- 检查 React 组件是否重新渲染

### 步骤 6: 检查 CallModal 是否渲染
**检查方法**:
1. 打开 React DevTools
2. 查找 `CallModal` 组件
3. 检查 `showCallModal` 的值

**如果 CallModal 没有渲染**:
- 检查条件渲染逻辑
- 检查 `showCallModal` 的值
- 检查是否有 CSS 问题导致不可见

## 可能的问题和解决方案

### 问题 1: 闭包问题
**症状**: `setShowCallModal` 被调用但状态没有更新

**原因**: useEffect 中的回调函数捕获了旧的 `setShowCallModal` 引用

**解决方案**: 
- 使用 `useRef` 存储回调
- 或者使用函数式更新: `setShowCallModal(prev => true)`

### 问题 2: 监听器被覆盖
**症状**: 第一次调用有效，后续调用无效

**原因**: `onStateChange` 每次调用都覆盖之前的回调

**解决方案**: 
- 确保 `onStateChange` 只被调用一次
- 或者改为支持多个监听器的实现

### 问题 3: 组件未挂载
**症状**: 完全没有日志输出

**原因**: ChatPage 组件没有正确渲染

**解决方案**:
- 检查路由配置
- 检查用户是否已登录
- 检查是否有导航错误

### 问题 4: Socket 连接时机
**症状**: 监听器注册了但收不到事件

**原因**: 监听器在 socket 连接前注册

**解决方案**:
- 确保在 `socketService.connect()` 之后调用 `webrtcService.init()`
- 检查 socket 连接状态

## 测试命令

### 在接收方浏览器控制台执行
```javascript
// 检查 webrtcService 状态
console.log('WebRTC 状态:', webrtcService.getCallState());

// 检查 socket 连接
console.log('Socket 连接:', socketService.isConnected());

// 手动触发状态变化（测试）
webrtcService.onStateChange((state) => {
  console.log('手动测试 - 状态变化:', state);
});
```

### 手动触发通话邀请（测试）
```javascript
// 在接收方控制台执行
socketService.on('callInvite', (data) => {
  console.log('手动监听 - 收到邀请:', data);
});
```

## 下一步行动

1. **刷新接收方页面**
2. **打开浏览器控制台**
3. **发起方发起通话**
4. **按照上述步骤逐一检查日志**
5. **记录哪一步失败了**
6. **根据失败的步骤查找对应的解决方案**

## 预期完整日志流程

```
# 页面加载
Socket 连接成功: { userId: 2, socketId: "..." }
初始化 WebRTC 服务，注册 Socket 监听器
=== 注册 WebRTC 状态变化监听器 ===
当前 showCallModal 状态: false
=== WebRTC 状态变化监听器注册完成 ===

# 收到通话邀请
=== WebRTC: 收到通话邀请 ===
邀请数据: { callerId: 1, conversationId: 5, callType: "audio" }
当前状态: idle
更新后状态: { status: "ringing", callType: "audio", isInitiator: false, remoteUserId: 1, conversationId: 5 }
是否有状态变化回调: true
=== 状态变化通知已发送 ===

# 状态变化回调
=== WebRTC 状态变化回调被触发 ===
新状态: { status: "ringing", callType: "audio", isInitiator: false, remoteUserId: 1, conversationId: 5 }
当前 showCallModal: false
准备显示通话模态框, 调用 setShowCallModal(true)
setShowCallModal(true) 已调用

# React 状态更新
>>> showCallModal 状态变化: true

# 此时应该看到通话模态框
```

如果任何一步的日志缺失，就说明问题出在那一步！
