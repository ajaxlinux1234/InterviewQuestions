# WebRTC 音视频通话功能

## 功能概述

实现了基于 WebRTC 的点对点音视频通话功能，支持：
- 语音通话
- 视频通话
- 通话邀请/接受/拒绝/挂断
- 实时音视频流传输
- 通话控制（静音、关闭摄像头）

## 技术架构

### 后端 (NestJS)

**文件**: `nest/src/gateways/im.gateway.ts`

实现了 WebRTC 信令服务器，负责转发以下事件：

1. **callInvite** - 发送通话邀请
   - 参数: `{ toUserId, conversationId, callType }`
   - 转发给目标用户

2. **callAccept** - 接受通话
   - 参数: `{ fromUserId, conversationId }`
   - 通知发起方

3. **callReject** - 拒绝通话
   - 参数: `{ fromUserId, conversationId }`
   - 通知发起方

4. **callHangup** - 挂断通话
   - 参数: `{ toUserId, conversationId }`
   - 通知对方

5. **webrtcOffer** - 转发 SDP Offer
   - 参数: `{ toUserId, offer }`
   - WebRTC 连接协商

6. **webrtcAnswer** - 转发 SDP Answer
   - 参数: `{ toUserId, answer }`
   - WebRTC 连接协商

7. **webrtcIceCandidate** - 转发 ICE 候选
   - 参数: `{ toUserId, candidate }`
   - NAT 穿透

### 前端 (React)

#### 1. WebRTC 服务 (`nest-react/src/services/webrtcService.ts`)

核心服务类，管理 WebRTC 连接和通话状态：

**主要功能**:
- PeerConnection 管理
- 本地/远程媒体流处理
- 通话状态机 (idle → calling/ringing → connected → ended)
- Socket 事件监听和处理
- ICE 候选收集和交换

**主要方法**:
- `startCall(toUserId, conversationId, callType)` - 发起通话
- `acceptCall()` - 接受通话
- `rejectCall()` - 拒绝通话
- `hangup()` - 挂断通话
- `toggleAudio()` - 切换音频
- `toggleVideo()` - 切换视频

**状态管理**:
```typescript
interface CallState {
  status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
  callType: 'audio' | 'video' | null;
  conversationId: number | null;
  remoteUserId: number | null;
}
```

#### 2. 通话 UI 组件 (`nest-react/src/components/CallModal.tsx`)

全屏模态框，显示通话界面：

**功能**:
- 视频显示（本地小窗口 + 远程大窗口）
- 语音通话界面（仅显示图标和状态）
- 通话控制按钮（接受、拒绝、挂断、静音、关闭摄像头）
- 通话计时器
- 状态显示

**UI 布局**:
- 头部：通话类型和状态
- 中间：视频区域或语音图标
- 底部：控制按钮

#### 3. 聊天页面集成 (`nest-react/src/pages/ChatPage.tsx`)

在聊天页面添加通话入口：

**新增功能**:
- 会话头部添加语音/视频通话按钮（仅私聊）
- 监听通话状态变化，自动显示/隐藏通话模态框
- 发起通话的处理函数

**按钮位置**: 会话头部右侧，详情按钮左边

## 使用流程

### 发起通话

1. 用户 A 在私聊会话中点击"语音通话"或"视频通话"按钮
2. 前端调用 `webrtcService.startCall()`
3. 获取本地媒体流（麦克风/摄像头）
4. 通过 Socket 发送 `callInvite` 事件给用户 B
5. 显示"正在呼叫..."状态

### 接受通话

1. 用户 B 收到 `callInvite` 事件
2. 自动显示通话模态框，状态为"收到通话邀请"
3. 用户 B 点击"接受"按钮
4. 获取本地媒体流
5. 发送 `callAccept` 事件给用户 A
6. 开始 WebRTC 连接协商

### WebRTC 连接建立

1. 用户 A 创建 Offer SDP，通过 Socket 发送给用户 B
2. 用户 B 收到 Offer，创建 Answer SDP，发送给用户 A
3. 双方交换 ICE 候选，进行 NAT 穿透
4. 连接建立成功，开始传输音视频流
5. 状态变为"已连接"，显示通话计时器

### 通话控制

- **静音**: 禁用/启用本地音频轨道
- **关闭摄像头**: 禁用/启用本地视频轨道
- **挂断**: 关闭 PeerConnection，停止媒体流，通知对方

### 结束通话

1. 任一方点击"挂断"按钮
2. 发送 `callHangup` 事件给对方
3. 关闭 PeerConnection
4. 停止所有媒体流
5. 状态变为"idle"
6. 自动关闭通话模态框

## 技术细节

### WebRTC 配置

```typescript
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
```

使用 Google 的公共 STUN 服务器进行 NAT 穿透。

### 媒体约束

**视频通话**:
```typescript
{
  audio: true,
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }
}
```

**语音通话**:
```typescript
{
  audio: true,
  video: false
}
```

### 状态同步

- 通话状态通过 `webrtcService.onStateChange()` 回调同步到 UI
- 媒体流通过 `onLocalStream()` 和 `onRemoteStream()` 回调传递
- 所有状态变化都是响应式的，自动更新 UI

## 注意事项

1. **HTTPS 要求**: WebRTC 需要在 HTTPS 环境下运行（localhost 除外）
2. **权限请求**: 需要用户授权麦克风和摄像头权限
3. **浏览器兼容性**: 需要现代浏览器支持 WebRTC API
4. **网络要求**: 需要稳定的网络连接，建议使用 TURN 服务器处理复杂网络环境
5. **仅私聊**: 当前实现仅支持一对一通话，不支持群组通话

## 测试步骤

1. 启动后端服务: `cd nest && pnpm start:dev`
2. 启动前端服务: `cd nest-react && pnpm start`
3. 使用两个浏览器窗口（或不同设备）登录不同账号
4. 建立私聊会话
5. 点击语音/视频通话按钮
6. 在另一个窗口接受通话
7. 测试通话功能和控制按钮

## 未来改进

- [ ] 添加通话历史记录
- [ ] 添加来电铃声
- [ ] 支持群组通话
- [ ] 添加屏幕共享功能
- [ ] 配置 TURN 服务器，提高连接成功率
- [ ] 添加通话质量监控
- [ ] 支持通话录制
- [ ] 优化移动端体验

## 相关文件

### 后端
- `nest/src/gateways/im.gateway.ts` - WebRTC 信令服务器

### 前端
- `nest-react/src/services/webrtcService.ts` - WebRTC 核心服务
- `nest-react/src/components/CallModal.tsx` - 通话 UI 组件
- `nest-react/src/pages/ChatPage.tsx` - 聊天页面集成

## 完成时间

2026-01-14
