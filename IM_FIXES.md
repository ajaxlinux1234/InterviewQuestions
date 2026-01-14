# IM 模块问题修复

## 修复的问题

### 1. 发送消息显示两条重复消息

**问题描述**：
用户发送消息后，消息列表中会显示两条相同的消息。

**根本原因**：
1. 前端在发送消息时，先添加了一条临时消息到本地状态
2. 后端通过 WebSocket 广播消息给所有会话成员（包括发送者自己）
3. 发送者收到 `newMessage` 事件后又添加了一次消息
4. 结果：同一条消息被添加了两次

**解决方案**：

#### 后端修改 (`nest/src/gateways/im.gateway.ts`)
```typescript
// 向会话中的所有在线成员发送消息（除了发送者自己）
conversation.members.forEach(member => {
  // 跳过发送者自己
  if (member.userId === userId) {
    return;
  }
  
  const memberSockets = this.userSockets.get(member.userId);
  if (memberSockets) {
    memberSockets.forEach(socketId => {
      this.server.to(socketId).emit('newMessage', message);
    });
  }
});
```

#### 前端修改 (`nest-react/src/pages/ChatPage.tsx`)
```typescript
// 监听新消息
const handleNewMessage = (message: any) => {
  console.log('收到新消息:', message);
  
  // 获取当前用户 ID
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // 只有当消息不是自己发送的时候才添加到消息列表
  // 自己发送的消息已经通过 MessageInput 添加了临时消息
  if (message.senderId !== currentUser.id) {
    addMessage(message);
  }
  
  // 如果是当前会话的消息，标记为已读
  if (currentConversation && message.conversationId === currentConversation.id) {
    socketService.markAsRead(message.conversationId, message.id);
  }
  
  // 刷新会话列表（更新最后一条消息和未读数）
  refetchConversations();
};
```

**修复效果**：
- ✅ 发送消息后只显示一条消息
- ✅ 临时消息正确更新为已发送状态
- ✅ 其他用户能正常收到消息

---

### 2. 已读状态不正确更新

**问题描述**：
1. 消息已经读了，但会话列表仍然显示未读
2. 切换会话时，历史消息没有被标记为已读

**根本原因**：
1. 只在收到新消息时标记已读，切换会话时没有标记
2. 未读数计算过于简化，只判断最后一条消息是否已读
3. 没有正确计算在 `lastReadMessageId` 之后的消息数量

**解决方案**：

#### 前端修改 (`nest-react/src/pages/ChatPage.tsx`)
```typescript
// 加入/离开会话房间，并标记历史消息为已读
useEffect(() => {
  if (currentConversation) {
    socketService.joinConversation(currentConversation.id);
    
    // 标记当前会话的所有消息为已读
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.id > 0) {
        socketService.markAsRead(currentConversation.id, lastMessage.id);
      }
    }
    
    return () => {
      socketService.leaveConversation(currentConversation.id);
    };
  }
}, [currentConversation, messages]);
```

#### 后端修改 (`nest/src/services/im.service.ts`)
```typescript
// 计算未读消息数
let unreadCount = 0;
if (lastMessage) {
  if (member.lastReadMessageId) {
    // 查询在 lastReadMessageId 之后的消息数量
    unreadCount = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId: conversation.id })
      .andWhere('message.id > :lastReadMessageId', { lastReadMessageId: member.lastReadMessageId })
      .andWhere('message.senderId != :userId', { userId }) // 不计算自己发送的消息
      .getCount();
  } else {
    // 如果没有已读记录，计算所有不是自己发送的消息
    unreadCount = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId: conversation.id })
      .andWhere('message.senderId != :userId', { userId })
      .getCount();
  }
}
```

**修复效果**：
- ✅ 切换会话时自动标记历史消息为已读
- ✅ 未读数准确计算（不包括自己发送的消息）
- ✅ 会话列表的未读徽章正确显示
- ✅ 刷新页面后未读状态保持正确

---

## 测试验证

### 测试场景 1：发送消息
1. 用户 A 发送一条消息
2. **预期结果**：
   - 用户 A 的消息列表中只显示一条消息
   - 消息状态从 "sending" 变为 "sent"
   - 用户 B 能收到这条消息

### 测试场景 2：接收消息
1. 用户 B 发送一条消息给用户 A
2. **预期结果**：
   - 用户 A 的会话列表显示未读徽章
   - 用户 A 点击会话后，未读徽章消失
   - 消息被标记为已读

### 测试场景 3：切换会话
1. 用户 A 有多个会话，其中一个有未读消息
2. 用户 A 点击该会话
3. **预期结果**：
   - 进入会话后，所有历史消息被标记为已读
   - 会话列表的未读徽章消失
   - 刷新页面后，未读状态保持正确

### 测试场景 4：刷新页面
1. 用户 A 有未读消息
2. 刷新页面
3. **预期结果**：
   - 未读数正确显示
   - 进入会话后，未读数清零

---

## 技术细节

### 消息流程
1. **发送消息**：
   ```
   前端 -> 添加临时消息到本地状态
   前端 -> WebSocket.emit('sendMessage')
   后端 -> 保存消息到数据库
   后端 -> 向其他成员广播 'newMessage'（不包括发送者）
   后端 -> 向发送者发送 'messageSent'（包含真实消息ID）
   前端 -> 更新临时消息的ID和状态
   ```

2. **接收消息**：
   ```
   后端 -> WebSocket.emit('newMessage')
   前端 -> 收到消息
   前端 -> 判断是否是自己发送的（通过 senderId）
   前端 -> 如果不是自己发送的，添加到消息列表
   前端 -> 如果是当前会话，标记为已读
   前端 -> 刷新会话列表（更新未读数）
   ```

3. **标记已读**：
   ```
   前端 -> WebSocket.emit('markAsRead', { conversationId, messageId })
   后端 -> 更新 conversation_members.lastReadMessageId
   后端 -> 向其他成员广播 'messageRead'
   前端 -> 刷新会话列表（更新未读数）
   ```

### 未读数计算逻辑
```sql
-- 计算未读消息数
SELECT COUNT(*) 
FROM messages 
WHERE conversationId = ? 
  AND id > lastReadMessageId 
  AND senderId != currentUserId
```

**关键点**：
- 只计算在 `lastReadMessageId` 之后的消息
- 不计算自己发送的消息
- 如果没有 `lastReadMessageId`，计算所有不是自己发送的消息

---

## 性能优化建议

### 当前实现
- 每次获取会话列表时，都要查询每个会话的未读消息数
- 对于有很多会话的用户，这可能会导致性能问题

### 优化方案
1. **缓存未读数**：
   - 在 `conversation_members` 表中添加 `unreadCount` 字段
   - 每次收到新消息时更新该字段
   - 标记已读时清零该字段

2. **使用 Redis 缓存**：
   - 将未读数存储在 Redis 中
   - 格式：`unread:{userId}:{conversationId}` -> count
   - 定期同步到数据库

3. **批量查询优化**：
   - 使用一次查询获取所有会话的未读数
   - 使用 GROUP BY 和子查询

---

## 修改的文件

### 后端
- `nest/src/gateways/im.gateway.ts` - 修改消息广播逻辑
- `nest/src/services/im.service.ts` - 改进未读数计算

### 前端
- `nest-react/src/pages/ChatPage.tsx` - 修复重复消息和已读标记

---

## 总结

通过这次修复，我们解决了两个关键问题：
1. ✅ 消息不再重复显示
2. ✅ 未读状态正确更新

系统现在能够：
- 正确处理消息的发送和接收
- 准确计算和显示未读消息数
- 在切换会话时自动标记消息为已读
- 在刷新页面后保持正确的未读状态

下一步可以考虑：
- 实现未读数的性能优化（缓存）
- 添加消息撤回功能
- 实现@提及功能
- 优化大量消息的加载性能
