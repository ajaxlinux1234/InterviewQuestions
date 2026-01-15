# Implementation Plan: AI Chat Streaming

## Overview

本实现计划将 AI 聊天流式输出功能分解为可执行的编码任务。实现将分为后端和前端两部分，采用增量开发方式，每个步骤都包含核心功能实现和相应的测试。

## Tasks

- [x] 1. 安装依赖和环境配置
  - 安装 LangChain 和相关依赖：`@langchain/openai`, `langchain`
  - 配置环境变量（GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODEL）
  - 验证 Groq API 连接
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. 实现 LLM 客户端
  - [x] 2.1 创建 LlmClient 类
    - 实现 ChatOpenAI 客户端初始化
    - 配置 Groq API 参数（baseURL, apiKey, modelName, streaming）
    - 实现 generateStream 方法返回 AsyncGenerator
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 2.2 编写 LlmClient 单元测试
    - 测试客户端初始化
    - 测试无效 API key 错误处理
    - 测试流式生成基本功能
    - _Requirements: 1.5_

- [x] 3. 实现 AI Service 核心逻辑
  - [x] 3.1 创建 AiService 类
    - 实现 streamResponse 方法生成流式响应
    - 实现 validateAndSanitizePrompt 方法验证和清理提示词
    - 实现 saveConversation 方法保存对话
    - 添加错误处理和日志记录
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1, 9.2, 9.3, 10.1_

  - [ ]* 3.2 编写属性测试：流式响应生成
    - **Property 1: Streaming Response Generation**
    - **Validates: Requirements 2.1, 2.2**
    - 生成随机有效提示词，验证所有都产生流式响应

  - [ ]* 3.3 编写属性测试：提示词验证
    - **Property 6: Prompt Validation**
    - **Validates: Requirements 3.6, 7.3**
    - 生成随机无效提示词，验证所有都被拒绝

  - [ ]* 3.4 编写属性测试：提示词清理
    - **Property 19: Prompt Sanitization**
    - **Validates: Requirements 10.1**
    - 生成包含特殊字符的提示词，验证清理功能

- [x] 4. 扩展数据库模型
  - [x] 4.1 更新 Message 实体
    - 添加 type 字段（枚举：text, image, file, ai_prompt, ai_response）
    - 添加 aiPromptId 字段（关联 AI 响应到提示）
    - 添加 metadata 字段（JSONB，存储 model, tokenCount, streamDuration）
    - 使 senderId 可为 null（AI 消息）
    - _Requirements: 9.5_

  - [x] 4.2 创建 AiRequestLog 实体
    - 定义字段：userId, prompt, response, model, tokenCount, duration, status, errorMessage
    - 添加索引：userId, createdAt
    - _Requirements: 10.4_

  - [x] 4.3 生成并运行数据库迁移
    - 生成迁移文件
    - 在开发环境运行迁移
    - 验证表结构正确
    - _Requirements: 9.5, 10.4_

- [ ]* 4.4 编写属性测试：消息持久化
  - **Property 17: Message Persistence**
  - **Validates: Requirements 9.1, 9.2, 9.3**
  - 生成随机 AI 对话，验证所有都被正确保存

- [ ]* 4.5 编写属性测试：AI 消息类型标记
  - **Property 18: AI Message Type Marking**
  - **Validates: Requirements 9.5**
  - 验证所有 AI 消息都有正确的 type 字段

- [x] 5. 实现 AI Controller 和 SSE 端点
  - [x] 5.1 创建 AiController
    - 实现 GET /api/ai/chat/stream 端点
    - 使用 @Sse() 装饰器
    - 添加 AuthGuard 认证
    - 实现查询参数验证（prompt）
    - 将 AiService 流转换为 Observable<MessageEvent>
    - 实现 SSE 格式化（data: ...\n\n）
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 5.2 实现错误处理
    - 捕获 LLM API 错误并发送错误事件
    - 捕获验证错误并返回 400
    - 捕获认证错误并返回 401
    - 实现超时处理（30秒）
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ]* 5.3 编写属性测试：SSE 格式合规
    - **Property 3: SSE Format Compliance**
    - **Validates: Requirements 2.5, 3.3**
    - 验证所有消息块都符合 SSE 格式

  - [ ]* 5.4 编写属性测试：流关闭
    - **Property 2: Stream Closure**
    - **Validates: Requirements 2.3, 2.4**
    - 验证所有流（成功或失败）都被正确关闭

  - [ ]* 5.5 编写属性测试：错误事件传输
    - **Property 14: Error Event Transmission**
    - **Validates: Requirements 7.5**
    - 模拟流式错误，验证错误事件被发送

- [x] 6. 实现速率限制和请求去重
  - [x] 6.1 实现速率限制中间件
    - 使用 @nestjs/throttler 或自定义实现
    - 配置每用户限制（10 请求/分钟）
    - 配置全局限制（100 请求/分钟）
    - 返回 429 错误当超过限制
    - _Requirements: 6.5, 10.2_

  - [x] 6.2 实现请求去重逻辑
    - 在 AiService 中实现去重检查
    - 使用 Redis 或内存缓存存储最近请求
    - 5秒时间窗口内拒绝重复请求
    - _Requirements: 6.3_

  - [ ]* 6.3 编写属性测试：速率限制
    - **Property 13: Rate Limiting**
    - **Validates: Requirements 6.5, 10.2**
    - 发送超过限制的请求，验证被拒绝

  - [ ]* 6.4 编写属性测试：请求去重
    - **Property 12: Request Deduplication**
    - **Validates: Requirements 6.3**
    - 在时间窗口内发送重复请求，验证被拒绝

- [x] 7. 实现审计日志
  - [x] 7.1 创建 AuditLogger 服务
    - 实现 logAiRequest 方法
    - 记录 userId, prompt, response, model, tokenCount, duration, status
    - 使用异步操作避免阻塞
    - _Requirements: 10.4_

  - [x] 7.2 集成审计日志到 AiService
    - 在 streamResponse 开始时记录请求
    - 在流完成时更新响应和 token 计数
    - 在错误时记录错误信息
    - _Requirements: 10.4_

  - [ ]* 7.3 编写属性测试：审计日志
    - **Property 20: Audit Logging**
    - **Validates: Requirements 10.4**
    - 发送随机请求，验证所有都被记录

- [x] 8. 实现内容过滤
  - [x] 8.1 创建 ContentFilter 服务
    - 实现基本的不当内容检测
    - 实现关键词过滤列表
    - 返回过滤结果和原因
    - _Requirements: 10.5_

  - [x] 8.2 集成内容过滤到 AiService
    - 在验证提示词时调用内容过滤
    - 拒绝包含不当内容的请求
    - 记录被过滤的请求
    - _Requirements: 10.5_

  - [ ]* 8.3 编写属性测试：内容过滤
    - **Property 21: Content Filtering**
    - **Validates: Requirements 10.5**
    - 生成包含不当内容的提示词，验证被过滤

- [x] 9. Checkpoint - 后端功能完成
  - 确保所有后端测试通过
  - 使用 Postman 或 curl 测试 SSE 端点
  - 验证数据库记录正确
  - 询问用户是否有问题

- [x] 10. 实现前端 SSE Service
  - [x] 10.1 创建 sseService.ts
    - 实现单例模式
    - 实现 connect 方法（防止重复连接）
    - 实现 disconnect 方法
    - 实现 isConnected 和 getCurrentPrompt 方法
    - 使用 EventSource API
    - _Requirements: 4.1, 4.2, 4.5, 6.1_

  - [x] 10.2 实现连接管理逻辑
    - 检查是否已有活动连接
    - 存储当前连接的提示词
    - 在新连接前关闭旧连接
    - 实现错误处理和重连逻辑
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 10.3 编写属性测试：单一连接
    - **Property 4: Single Connection Per Request**
    - **Validates: Requirements 4.1, 4.2, 6.1**
    - 尝试创建多个连接，验证只有一个成功

  - [ ]* 10.4 编写属性测试：连接复用
    - **Property 5: Connection Reuse**
    - **Validates: Requirements 4.5**
    - 验证同一 EventSource 实例被复用

- [x] 11. 实现 AI 消息渲染组件
  - [x] 11.1 创建 AiMessageRenderer 组件
    - 接收 message 和 onStop props
    - 渲染消息内容
    - 显示流式指示器（isStreaming 时）
    - 提供停止按钮
    - 应用 AI 消息特殊样式
    - _Requirements: 5.1, 5.2, 5.5, 8.2, 8.3, 8.5_

  - [x] 11.2 实现自动滚动功能
    - 使用 useRef 获取消息容器
    - 在新块到达时检查滚动位置
    - 如果用户在底部，自动滚动到新内容
    - _Requirements: 5.4_

  - [ ]* 11.3 编写属性测试：块追加
    - **Property 7: Chunk Appending**
    - **Validates: Requirements 5.1**
    - 发送随机块，验证所有都被追加（不替换）

  - [ ]* 11.4 编写属性测试：格式保留
    - **Property 8: Text Formatting Preservation**
    - **Validates: Requirements 5.2**
    - 发送包含格式的内容，验证格式被保留

  - [ ]* 11.5 编写属性测试：完成标记
    - **Property 9: Stream Completion Marking**
    - **Validates: Requirements 5.3**
    - 验证完成的流被标记为 isStreaming=false

  - [ ]* 11.6 编写属性测试：自动滚动
    - **Property 10: Auto-scroll Behavior**
    - **Validates: Requirements 5.4**
    - 验证新内容到达时自动滚动

  - [ ]* 11.7 编写属性测试：输入指示器
    - **Property 11: Typing Indicator**
    - **Validates: Requirements 5.5**
    - 验证流式时显示指示器，完成时隐藏

  - [ ]* 11.8 编写属性测试：AI 消息样式
    - **Property 15: AI Message Styling**
    - **Validates: Requirements 8.2, 8.3**
    - 验证所有 AI 消息都有独特样式

- [x] 12. 实现 AI 聊天页面
  - [x] 12.1 创建 AiChatPage 组件
    - 实现消息列表状态管理
    - 实现输入框和发送功能
    - 集成 sseService
    - 实现 sendPrompt 方法
    - 实现 stopStreaming 方法
    - 实现 handleStreamChunk 方法
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 12.2 实现流式消息处理
    - 创建临时消息对象（isStreaming=true）
    - 监听 SSE 消息事件
    - 追加块到当前消息
    - 处理完成事件（isStreaming=false）
    - 处理错误事件
    - _Requirements: 5.1, 5.3, 7.4_

  - [x] 12.3 实现加载状态
    - 显示加载指示器（发送请求到第一块）
    - 显示流式指示器（第一块到完成）
    - 显示错误状态
    - _Requirements: 8.4_

  - [ ]* 12.4 编写属性测试：加载状态
    - **Property 16: Loading State**
    - **Validates: Requirements 8.4**
    - 验证请求发送后显示加载状态

- [x] 13. 集成到现有聊天系统
  - [x] 13.1 添加 AI 聊天入口
    - 在聊天页面添加"AI 助手"按钮或标签
    - 实现切换到 AI 聊天界面
    - 或在现有会话中添加 AI 功能
    - _Requirements: 8.1_

  - [x] 13.2 实现消息历史显示
    - 从数据库加载 AI 对话历史
    - 在消息列表中显示 AI 消息
    - 区分 AI 消息和普通消息
    - _Requirements: 9.4_

  - [x] 13.3 实现 API 集成
    - 创建 aiApi.ts 服务
    - 实现 streamAiChat 方法
    - 处理认证 token
    - 处理 SSE 连接
    - _Requirements: 3.5_

- [x] 14. 实现错误处理和用户反馈
  - [x] 14.1 实现前端错误处理
    - 捕获网络错误
    - 捕获 SSE 连接错误
    - 捕获超时错误
    - 显示用户友好的错误消息
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 14.2 实现重试功能
    - 在错误时显示重试按钮
    - 实现重新发送请求
    - 限制重试次数
    - _Requirements: 7.4_

  - [x] 14.3 实现停止功能
    - 添加停止按钮到流式消息
    - 实现停止逻辑（关闭 SSE 连接）
    - 标记消息为已取消
    - _Requirements: 6.2, 8.5_

- [ ] 15. Checkpoint - 前端功能完成
  - 确保所有前端测试通过
  - 在浏览器中测试完整流程
  - 验证 UI 响应流畅
  - 检查浏览器 DevTools 确认无重复连接
  - 询问用户是否有问题

- [ ] 16. 端到端集成测试
  - [ ] 16.1 测试完整流程
    - 用户登录 → 打开 AI 聊天 → 发送提示 → 接收流式响应 → 保存到数据库
    - 验证每个步骤正常工作
    - _Requirements: All_

  - [ ] 16.2 测试错误场景
    - 测试无效 API key
    - 测试网络中断
    - 测试超时
    - 测试速率限制
    - 验证错误处理正确
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 16.3 测试连接管理
    - 测试导航离开时连接关闭
    - 测试停止按钮
    - 测试重复请求被阻止
    - 验证无资源泄漏
    - _Requirements: 4.3, 6.1, 6.2, 6.3_

  - [ ] 16.4 测试性能
    - 测试长响应的流式渲染
    - 测试并发请求
    - 测试数据库性能
    - 验证响应时间合理
    - _Requirements: Performance_

- [ ] 17. 安全性和合规性检查
  - [ ] 17.1 验证 API key 安全
    - 确认 API key 不在前端代码中
    - 确认 API key 不在 API 响应中
    - 确认 API key 在环境变量中
    - _Requirements: 10.3_

  - [ ] 17.2 验证认证和授权
    - 测试未认证请求被拒绝
    - 测试 token 验证
    - 测试用户隔离
    - _Requirements: 3.5, 10.2_

  - [ ] 17.3 验证输入验证和清理
    - 测试各种恶意输入
    - 验证 SQL 注入防护
    - 验证 XSS 防护
    - _Requirements: 10.1, 10.5_

  - [ ] 17.4 验证审计日志
    - 检查所有请求都被记录
    - 验证日志包含必要信息
    - 测试日志查询功能
    - _Requirements: 10.4_

- [ ] 18. 文档和部署准备
  - [ ] 18.1 更新 API 文档
    - 记录 SSE 端点
    - 记录请求/响应格式
    - 记录错误代码
    - 添加使用示例

  - [ ] 18.2 创建部署清单
    - 列出环境变量
    - 列出数据库迁移
    - 列出依赖安装
    - 创建部署脚本

  - [ ] 18.3 创建监控仪表板
    - 设置 token 使用监控
    - 设置错误率监控
    - 设置响应时间监控
    - 设置并发连接监控

- [ ] 19. 最终测试和验收
  - 在生产环境测试完整功能
  - 验证所有需求都已实现
  - 验证所有测试都通过
  - 获取用户验收确认

## Notes

- 标记 `*` 的任务为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- 在 Checkpoint 任务处暂停，确保增量验证
- 属性测试应运行至少 100 次迭代
- 单元测试应覆盖核心逻辑和边界情况
- 集成测试应验证端到端流程
- 所有测试应标记：**Feature: ai-chat-streaming, Property {number}: {property_text}**
