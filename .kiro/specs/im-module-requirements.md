---
title: IM (即时通讯) 模块需求规格
status: in-progress (约 75% 完成)
created: 2026-01-14
updated: 2026-01-14
---

# IM 模块需求规格

## 项目概述

在 NestJS 项目中实现完整的即时通讯 (IM) 系统，支持实时消息收发、文件传输、在线状态管理等功能。

## 技术栈

### 后端
- NestJS + WebSocket (Socket.IO)
- TypeORM + MySQL
- JWT 身份认证
- 文件上传 (Multer)

### 前端
- React 19
- Socket.IO Client
- TanStack Query
- Zustand (状态管理)
- Tailwind CSS

## 已完成功能

### 数据库设计 ✅
- [x] 5 张表设计完成 (`nest/database/im_system.sql`)
  - contacts (联系人表)
  - conversations (会话表)
  - conversation_members (会话成员表)
  - messages (消息表)
  - message_read_status (消息已读状态表)
- [x] 索引优化
- [x] 外键约束
- [x] 测试数据插入
- [x] 视图和存储过程

### 实体类 ✅
- [x] Contact Entity (`nest/src/entities/contact.entity.ts`)
- [x] Conversation Entity (`nest/src/entities/conversation.entity.ts`)
- [x] ConversationMember Entity (`nest/src/entities/conversation-member.entity.ts`)
- [x] Message Entity (`nest/src/entities/message.entity.ts`)

### DTOs ✅
- [x] SendMessageDto
- [x] QueryConversationsDto
- [x] QueryMessagesDto
- [x] CreateConversationDto
- [x] MarkReadDto
- [x] ConversationResponseDto
- [x] MessageResponseDto
- [x] ContactResponseDto

### 服务层 ✅
- [x] ImService (`nest/src/services/im.service.ts`)
  - [x] getContacts() - 获取联系人列表
  - [x] getConversations() - 获取会话列表（分页）
  - [x] getConversationDetail() - 获取会话详情
  - [x] getMessages() - 获取消息列表（分页、支持 beforeMessageId）
  - [x] sendMessage() - 发送消息
  - [x] createConversation() - 创建会话（私聊/群聊）
  - [x] markAsRead() - 标记消息已读
  - [x] findPrivateConversation() - 查找私聊会话

### WebSocket 网关 ✅
- [x] ImGateway (`nest/src/gateways/im.gateway.ts`)
  - [x] JWT 身份认证（握手时验证 token）
  - [x] 连接管理（userSockets Map）
  - [x] handleConnection() - 连接处理
  - [x] handleDisconnect() - 断开连接处理
  - [x] @SubscribeMessage('sendMessage') - 发送消息
  - [x] @SubscribeMessage('joinConversation') - 加入会话房间
  - [x] @SubscribeMessage('leaveConversation') - 离开会话房间
  - [x] @SubscribeMessage('markAsRead') - 标记已读
  - [x] @SubscribeMessage('typing') - 正在输入
  - [x] @SubscribeMessage('stopTyping') - 停止输入
  - [x] getOnlineUsers() - 获取在线用户列表
  - [x] isUserOnline() - 检查用户是否在线
  - [x] sendToUser() - 向指定用户发送消息
  - [x] WebRTC 信令事件（音视频通话）
    - [x] @SubscribeMessage('callInvite') - 发送通话邀请
    - [x] @SubscribeMessage('callAccept') - 接受通话
    - [x] @SubscribeMessage('callReject') - 拒绝通话
    - [x] @SubscribeMessage('callHangup') - 挂断通话
    - [x] @SubscribeMessage('webrtcOffer') - 转发 SDP Offer
    - [x] @SubscribeMessage('webrtcAnswer') - 转发 SDP Answer
    - [x] @SubscribeMessage('webrtcIceCandidate') - 转发 ICE 候选

## 已完成功能（续）

### 后端 REST API ✅

#### 1. IM Controller ✅
**文件**: `nest/src/controllers/im.controller.ts`

**已实现的接口**:

```typescript
// 联系人管理
GET    /api/im/contacts              - 获取联系人列表 ✅
POST   /api/im/contacts              - 添加联系人 ✅
DELETE /api/im/contacts/:id          - 删除联系人 ✅

// 会话管理
GET    /api/im/conversations         - 获取会话列表（分页）✅
GET    /api/im/conversations/:id     - 获取会话详情 ✅
POST   /api/im/conversations         - 创建会话 ✅
DELETE /api/im/conversations/:id     - 删除会话 ✅

// 消息管理
GET    /api/im/messages              - 获取消息列表（分页）✅
POST   /api/im/messages              - 发送消息 ✅
POST   /api/im/messages/:id/read     - 标记消息已读 ✅

// 文件上传
POST   /api/im/upload/image          - 上传图片 ✅
POST   /api/im/upload/video          - 上传视频 ✅
```

**实现特性**:
- ✅ 使用 @UseGuards(AuthGuard) 保护所有接口
- ✅ 使用 Fastify @fastify/multipart 处理文件上传（不是 Express multer）
- ✅ 文件存储在 `nest/uploads/im/images` 和 `nest/uploads/im/videos` 目录
- ✅ 图片支持格式: jpg, jpeg, png, gif (最大 5MB)
- ✅ 视频支持格式: mp4, mov, avi (最大 50MB)
- ✅ 返回文件访问 URL
- ✅ 文件类型和大小验证
- ✅ 使用 UUID 生成唯一文件名
- ✅ 自动创建上传目录

#### 2. IM Module ✅
**文件**: `nest/src/modules/im.module.ts`

**已配置**:
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contact,
      Conversation,
      ConversationMember,
      Message,
      User,
    ]),
    AuthModule,
  ],
  controllers: [ImController],
  providers: [ImService, ImGateway],
  exports: [ImService, ImGateway],
})
```

#### 3. 更新 AppModule ✅
**文件**: `nest/src/app.module.ts`

**已完成**:
- ✅ 在 entities 数组中添加 IM 相关实体
- ✅ 在 imports 数组中添加 ImModule

#### 4. 文件上传配置 ✅
**文件**: `nest/src/main.ts`

**已实现**:
- ✅ 注册 @fastify/multipart 插件
- ✅ 配置文件大小限制（50MB）
- ✅ 在控制器中实现文件类型验证
- ✅ 在控制器中实现文件大小验证
- ✅ 使用 UUID 生成唯一文件名

### 关键问题修复 ✅

#### 1. Socket 认证问题 ✅
**问题**: Socket 连接失败，"jwt malformed" 错误
**解决方案**: 
- ✅ 修改 ImGateway 使用 AuthService.validateToken() 而不是 JwtService
- ✅ 系统使用自定义 token（64位十六进制字符串），不是 JWT
- ✅ 测试通过 `test-socket-auth.js`

#### 2. 消息重复显示问题 ✅
**问题**: 发送消息后显示两条相同消息
**解决方案**:
- ✅ 后端：广播 newMessage 时跳过发送者自己
- ✅ 前端：handleNewMessage 中检查 senderId，避免添加自己的消息
- ✅ 文档：`IM_FIXES.md`

#### 3. 未读状态不正确问题 ✅
**问题**: 消息已读但仍显示未读
**解决方案**:
- ✅ 前端：切换会话时标记历史消息为已读
- ✅ 后端：改进未读数计算，查询 lastReadMessageId 之后的消息数（不包括自己发送的）
- ✅ 文档：`IM_FIXES.md`

#### 4. 文件上传 415 错误 ✅
**问题**: 文件上传返回 "415 Unsupported Media Type"
**解决方案**:
- ✅ 识别项目使用 Fastify 而不是 Express
- ✅ 安装 @fastify/multipart 插件
- ✅ 重写文件上传方法使用 Fastify 原生 API
- ✅ 测试通过 `test-upload.js`
- ✅ 文档：`FILE_UPLOAD_FIX.md`

#### 5. Socket 单例连接 ✅
**问题**: 每次切换会话都重新连接 socket
**解决方案**:
- ✅ 实现 socketService 单例模式
- ✅ 所有会话共享同一个 socket 连接
- ✅ 只在组件卸载时移除事件监听器，不断开连接
- ✅ 优化 useEffect 依赖，避免重复连接

#### 6. WebRTC 音视频通话 ✅
**功能**: 实现基于 WebRTC 的点对点音视频通话
**文档**: `WEBRTC_CALLING.md`

**后端实现** (`nest/src/gateways/im.gateway.ts`):
- ✅ WebRTC 信令服务器（转发 Offer/Answer/ICE）
- ✅ 通话邀请/接受/拒绝/挂断事件

**前端实现**:
- ✅ WebRTC 服务 (`nest-react/src/services/webrtcService.ts`)
  - PeerConnection 管理
  - 媒体流处理
  - 通话状态机
  - 音视频控制
- ✅ 通话 UI 组件 (`nest-react/src/components/CallModal.tsx`)
  - 全屏通话界面
  - 视频显示（本地+远程）
  - 控制按钮（接受/拒绝/挂断/静音/关闭摄像头）
  - 通话计时器
- ✅ 聊天页面集成 (`nest-react/src/pages/ChatPage.tsx`)
  - 语音/视频通话按钮（仅私聊）
  - 自动显示/隐藏通话模态框

**支持功能**:
- ✅ 语音通话
- ✅ 视频通话
- ✅ 实时音视频流传输
- ✅ 通话控制（静音、关闭摄像头）
- ✅ 通话状态显示

## 待完成功能

### 前端实现

#### 1. WebSocket 服务 ✅
**文件**: `nest-react/src/services/socketService.ts`

**已实现**:
```typescript
class SocketService {
  private socket: Socket | null = null;
  
  // 连接管理 ✅
  connect(token: string): void
  disconnect(): void
  isConnected(): boolean
  
  // 事件监听 ✅
  on(event: string, callback: Function): void
  off(event: string, callback?: Function): void
  
  // 发送消息 ✅
  sendMessage(data: SendMessageDto): void
  joinConversation(conversationId: number): void
  leaveConversation(conversationId: number): void
  markAsRead(conversationId: number, messageId: number): void
  typing(conversationId: number): void
  stopTyping(conversationId: number): void
  
  // 重连逻辑 ✅
  private handleReconnect(): void
}
```

**实现特性**:
- ✅ 单例模式（避免重复连接）
- ✅ 连接状态检查（避免重复连接）
- ✅ 手动重连控制
- ✅ 错误处理
- ✅ 事件订阅/取消订阅

#### 2. IM API 服务 ✅
**文件**: `nest-react/src/services/imApi.ts`

**已实现**:
```typescript
// 联系人 ✅
export const getContacts = () => api.get('/im/contacts')
export const addContact = (contactUserId: number) => api.post('/im/contacts', { contactUserId })
export const deleteContact = (id: number) => api.delete(`/im/contacts/${id}`)

// 会话 ✅
export const getConversations = (params) => api.get('/im/conversations', { params })
export const getConversationDetail = (id: number) => api.get(`/im/conversations/${id}`)
export const createConversation = (data) => api.post('/im/conversations', data)

// 消息 ✅
export const getMessages = (params) => api.get('/im/messages', { params })
export const sendMessage = (data) => api.post('/im/messages', data)

// 文件上传 ✅
export const uploadImage = (file: File) => api.post('/im/upload/image', formData)
export const uploadVideo = (file: File) => api.post('/im/upload/video', formData)
```

#### 3. IM 状态管理 ✅
**文件**: `nest-react/src/stores/imStore.ts`

**已实现**:
```typescript
interface ImStore {
  // 状态 ✅
  contacts: Contact[]
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  
  // 操作 ✅
  setContacts: (contacts: Contact[]) => void
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (conversation: Conversation | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (tempId: string, updates: Partial<Message>) => void
}
```

#### 4. 聊天页面 ✅
**文件**: `nest-react/src/pages/ChatPage.tsx`

**已实现布局**:
```
┌─────────────────────────────────────────────────────┐
│  Header (顶部导航栏 + 在线状态)                        │
├──────────┬──────────────────────────┬────────────────┤
│          │                          │                │
│  左侧栏   │      中间聊天区域          │   右侧详情栏    │
│          │                          │                │
│  联系人   │  ┌──────────────────┐   │   会话信息      │
│  列表     │  │  会话头部         │   │                │
│          │  ├──────────────────┤   │   成员列表      │
│  会话     │  │                  │   │                │
│  列表     │  │  消息列表         │   │   设置         │
│          │  │                  │   │                │
│  (可切换) │  │                  │   │                │
│          │  ├──────────────────┤   │                │
│          │  │  输入框 + 工具栏  │   │                │
│          │  └──────────────────┘   │                │
└──────────┴──────────────────────────┴────────────────┘
```

**已实现功能**:
- ✅ 左侧栏可在"联系人"和"会话"之间切换
- ✅ 显示在线状态（🟢/🔴）
- ✅ 显示未读消息数（红色徽章）
- ✅ 显示最后一条消息预览
- ✅ 点击会话切换聊天对象
- ✅ Socket 单例连接（所有会话共享）
- ✅ 自动标记消息已读（切换会话时）
- ✅ 实时消息推送
- ✅ 消息发送状态显示

#### 5. 消息组件 ✅ (部分)
**文件**: `nest-react/src/components/MessageList.tsx`

**已支持的消息类型**:
- ✅ 文本消息
- ⏳ 图片消息（点击预览大图）
- ⏳ 视频消息（内嵌播放器）
- ⏳ 系统消息（居中显示）

**已实现功能**:
- ✅ 显示发送者头像和昵称
- ✅ 显示发送时间
- ✅ 区分自己和他人的消息（左右布局）
- ✅ 显示消息状态（发送中、已发送）
- ⏳ 支持消息引用回复

#### 6. 输入框组件 ✅ (部分)
**文件**: `nest-react/src/components/MessageInput.tsx`

**已实现功能**:
- ✅ 文本输入（支持多行）
- ✅ 发送按钮
- ✅ 添加临时消息到本地状态
- ✅ 通过 WebSocket 发送消息
- ⏳ Emoji 选择器
- ⏳ 图片上传（点击或拖拽）
- ⏳ 视频上传（点击或拖拽）
- ⏳ 输入时触发 typing 事件
- ⏳ 停止输入 3 秒后触发 stopTyping 事件

#### 7. 会话列表组件 ✅
**文件**: `nest-react/src/components/ConversationList.tsx`

**已实现功能**:
- ✅ 显示会话列表
- ✅ 显示未读消息数徽章
- ✅ 显示最后一条消息预览
- ✅ 高亮当前选中的会话
- ✅ 点击切换会话

#### 8. 会话详情侧边栏 ✅ (部分)
**文件**: `nest-react/src/components/ConversationDetail.tsx`

**已实现功能**:
- ✅ 会话信息（名称、头像、类型）
- ✅ 成员列表
- ⏳ 显示在线状态
- ⏳ 群聊设置（仅群聊显示）
  - ⏳ 修改群名称
  - ⏳ 修改群头像
  - ⏳ 添加成员
  - ⏳ 移除成员
- ⏳ 免打扰开关
- ⏳ 清空聊天记录
- ⏳ 退出会话

#### 9. 路由配置 ✅
**文件**: `nest-react/src/App.tsx`

**已添加**:
```typescript
<Route 
  path="/chat" 
  element={
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  } 
/>
```

#### 10. 导航链接 ⏳
**文件**: `nest-react/src/pages/DashboardPage.tsx`

**待添加**:
- ⏳ 在导航菜单中添加"聊天"链接
- ⏳ 显示未读消息总数徽章

## 待完成功能（优先级排序）

### 高优先级
1. ⏳ 图片消息显示和预览
2. ⏳ 视频消息显示和播放
3. ⏳ 图片上传 UI（MessageInput）
4. ⏳ 视频上传 UI（MessageInput）
5. ⏳ Dashboard 导航链接和未读徽章

### 中优先级
6. ⏳ Emoji 选择器
7. ⏳ 输入状态提示（typing indicator）
8. ⏳ 消息引用回复
9. ⏳ 会话详情完善（群聊设置）
10. ⏳ 在线状态显示

### 低优先级
11. ⏳ 消息虚拟滚动（性能优化）
12. ⏳ 图片懒加载
13. ⏳ 消息搜索
14. ⏳ 免打扰设置
15. ⏳ 清空聊天记录

## 非功能性需求

### 性能要求
- WebSocket 连接支持高并发（1000+ 在线用户）
- 消息列表虚拟滚动（处理大量历史消息）
- 图片懒加载
- 消息分页加载（每次 50 条）

### 安全要求
- WebSocket 连接必须通过 JWT 认证
- 文件上传类型和大小验证
- XSS 防护（消息内容转义）
- CSRF 防护

### 用户体验
- 消息发送失败重试机制
- 断线重连提示
- 加载状态提示
- 错误提示友好
- 支持键盘快捷键（Enter 发送，Shift+Enter 换行）

### 可维护性
- 代码注释完整（中文）
- 错误日志记录
- 性能监控埋点

## 验收标准

### 后端
- [x] 所有 REST API 接口正常工作 ✅
- [x] WebSocket 连接认证成功 ✅
- [x] 消息实时推送正常 ✅
- [x] 文件上传功能正常 ✅
- [x] 数据库操作无错误 ✅
- [x] 日志记录完整 ✅

### 前端
- [x] 页面布局符合设计要求 ✅
- [x] WebSocket 连接/断开正常 ✅
- [x] 消息收发实时性良好 ✅
- [ ] 文件上传预览正常 ⏳ (API 已完成，UI 待实现)
- [ ] 在线状态显示准确 ⏳ (后端支持，前端 UI 待完善)
- [x] 未读消息计数准确 ✅
- [ ] 输入状态提示正常 ⏳ (后端支持，前端 UI 待实现)
- [ ] 断线重连机制有效 ⏳ (基础实现完成，需进一步测试)

### 集成测试
- [x] 基础功能测试 ✅ (通过 test-socket-auth.js, test-upload.js)
- [ ] 多用户同时在线测试 ⏳
- [ ] 消息并发发送测试 ⏳
- [ ] 文件上传并发测试 ⏳
- [ ] 断线重连测试 ⏳
- [ ] 长时间连接稳定性测试 ⏳

## 实施计划

### Phase 1: 后端 REST API ✅ (已完成)
1. ✅ 创建 ImController
2. ✅ 实现文件上传配置（Fastify multipart）
3. ✅ 创建 ImModule
4. ✅ 更新 AppModule
5. ✅ 测试所有 API 接口

### Phase 2: 前端基础设施 ✅ (已完成)
1. ✅ 实现 SocketService（单例模式）
2. ✅ 实现 imApi
3. ✅ 实现 imStore
4. ✅ 配置路由

### Phase 3: 前端 UI 组件 ✅ (基础完成)
1. ✅ 实现 ChatPage 布局
2. ✅ 实现 MessageList 组件
3. ✅ 实现 MessageInput 组件（基础版）
4. ✅ 实现 ConversationList 组件
5. ✅ 实现 ConversationDetail 组件（基础版）

### Phase 4: 功能完善 ⏳ (进行中)
1. ⏳ 文件上传 UI（图片、视频）
2. ⏳ 图片消息显示和预览
3. ⏳ 视频消息显示和播放
4. ⏳ Emoji 选择器
5. ⏳ 输入状态提示（typing indicator）
6. ⏳ Dashboard 导航链接

### Phase 5: 优化和测试 ⏳ (待开始)
1. ⏳ 性能优化（虚拟滚动、懒加载）
2. ⏳ 错误处理完善
3. ⏳ 用户体验优化
4. ⏳ 集成测试（多用户、并发、稳定性）

## 当前状态总结

### 已完成 (约 75%)
- ✅ 完整的后端 API 和 WebSocket 实现
- ✅ 数据库设计和实体类
- ✅ 前端基础架构（Socket、API、Store）
- ✅ 基础聊天 UI（三栏布局）
- ✅ 文本消息收发
- ✅ 未读状态管理
- ✅ 文件上传后端 API
- ✅ WebRTC 音视频通话（语音+视频）
- ✅ 关键问题修复（认证、重复消息、未读状态、文件上传）

### 待完成 (约 25%)
- ⏳ 图片/视频消息 UI
- ⏳ 文件上传 UI
- ⏳ Emoji 选择器
- ⏳ 输入状态提示
- ⏳ 会话详情完善
- ⏳ 性能优化
- ⏳ 全面测试

### 下一步建议
1. **优先实现图片/视频消息显示**（后端 API 已就绪）
2. **添加文件上传 UI**（MessageInput 组件）
3. **完善 Dashboard 导航**（添加聊天入口）
4. **进行多用户测试**（验证并发和稳定性）

## 技术难点和解决方案

### 1. WebSocket 断线重连 ✅ (基础实现完成)
**问题**: 网络不稳定导致连接断开
**已实现**: 
- ✅ Socket.IO 内置自动重连机制
- ✅ 连接状态检查（isConnected）
- ✅ 手动重连控制
**待完善**:
- ⏳ 重连成功后重新加入会话房间
- ⏳ 同步离线期间的消息
- ⏳ 用户友好的重连提示

### 2. 消息顺序保证 ✅
**问题**: 并发消息可能乱序
**已实现**:
- ✅ 使用数据库自增 ID 保证顺序
- ✅ 客户端按 ID 排序显示
- ✅ 使用临时 ID 标识发送中的消息
- ✅ messageSent 事件更新临时消息为真实 ID

### 3. 文件上传进度 ⏳
**问题**: 大文件上传需要显示进度
**待实现**:
- ⏳ 使用 axios onUploadProgress 回调
- ⏳ 显示进度条
- ⏳ 支持取消上传

### 4. 消息已读状态 ✅ (基础实现完成)
**问题**: 群聊中多人已读状态复杂
**已实现**:
- ✅ 使用 conversation_members.lastReadMessageId 记录已读位置
- ✅ 准确计算未读消息数（不包括自己发送的）
- ✅ 切换会话时自动标记已读
**待完善**:
- ⏳ 显示"已读 X 人"
- ⏳ 点击查看已读列表

### 5. 在线状态同步 ✅ (后端完成)
**问题**: 用户在线状态需要实时更新
**已实现**:
- ✅ Gateway 维护 userSockets Map
- ✅ 用户连接/断开时更新状态
- ✅ getOnlineUsers() 和 isUserOnline() 方法
**待完善**:
- ⏳ 前端显示在线状态（绿点）
- ⏳ 广播在线状态变化
- ⏳ 定期心跳检测

## 参考资料

- [Socket.IO 官方文档](https://socket.io/docs/v4/)
- [NestJS WebSocket 文档](https://docs.nestjs.com/websockets/gateways)
- [Multer 文件上传](https://github.com/expressjs/multer)
- [React DnD 拖拽上传](https://react-dnd.github.io/react-dnd/)

## 附录

### 数据库表关系图
```
users (用户表)
  ↓
contacts (联系人表) ← user_id, contact_user_id
  ↓
conversations (会话表) ← creator_id
  ↓
conversation_members (会话成员表) ← conversation_id, user_id
  ↓
messages (消息表) ← conversation_id, sender_id
  ↓
message_read_status (已读状态表) ← message_id, user_id
```

### WebSocket 事件流程图
```
客户端连接 → JWT 认证 → 加入用户房间 → 发送 connected 事件
                ↓
          认证失败 → 发送 error 事件 → 断开连接

发送消息 → 验证会话成员 → 保存消息 → 推送给所有在线成员
            ↓
      验证失败 → 发送 error 事件

加入会话 → 验证会话成员 → 加入会话房间 → 发送 joinedConversation 事件
```

### API 响应格式
```typescript
// 成功响应
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}

// 错误响应
{
  "success": false,
  "error": "错误信息",
  "statusCode": 400
}

// 分页响应
{
  "success": true,
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "hasMore": true
}
```
