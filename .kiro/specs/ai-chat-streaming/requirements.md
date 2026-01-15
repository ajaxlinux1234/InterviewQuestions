# Requirements Document: AI Chat Streaming

## Introduction

本功能为 IM 系统添加 AI 聊天能力，允许用户向 AI 提问并获得流式响应。系统将集成大语言模型（LLM），通过 Server-Sent Events (SSE) 实现流式输出，前端实时渲染 AI 回复内容。

## Glossary

- **AI_Chat_Service**: 后端服务，负责与大语言模型交互并管理流式响应
- **LLM**: Large Language Model，大语言模型（如 Groq 的 llama-3.3-70b-versatile）
- **SSE**: Server-Sent Events，服务器推送事件，用于实现服务器到客户端的单向流式数据传输
- **Stream_Connection**: SSE 连接，用于传输 AI 响应流
- **Token**: LLM API 的计费单位，需要避免浪费
- **Message_Chunk**: 流式响应中的单个数据块
- **Frontend_Renderer**: 前端组件，负责实时渲染流式内容

## Requirements

### Requirement 1: 集成大语言模型

**User Story:** 作为系统管理员，我希望系统能够集成大语言模型 API，以便为用户提供 AI 对话能力。

#### Acceptance Criteria

1. THE AI_Chat_Service SHALL integrate with Groq API using the provided API key
2. THE AI_Chat_Service SHALL use the llama-3.3-70b-versatile model
3. THE AI_Chat_Service SHALL configure the LLM client with streaming enabled
4. THE AI_Chat_Service SHALL use LangChain's ChatOpenAI client for API interaction
5. WHEN the API key is invalid or missing, THE AI_Chat_Service SHALL return a descriptive error message

### Requirement 2: 流式响应生成

**User Story:** 作为用户，我希望 AI 的回复能够流式输出，以便我能实时看到生成的内容而不必等待完整响应。

#### Acceptance Criteria

1. WHEN a user sends a prompt to the AI, THE AI_Chat_Service SHALL generate a streaming response
2. THE AI_Chat_Service SHALL yield message chunks as they are received from the LLM
3. WHEN the LLM stream completes, THE AI_Chat_Service SHALL close the stream gracefully
4. IF the LLM stream encounters an error, THEN THE AI_Chat_Service SHALL send an error chunk and close the stream
5. THE AI_Chat_Service SHALL format each chunk as SSE-compatible data

### Requirement 3: SSE 端点实现

**User Story:** 作为前端开发者，我希望有一个 SSE 端点来接收 AI 响应流，以便实现实时渲染。

#### Acceptance Criteria

1. THE Backend SHALL provide an SSE endpoint at `/api/ai/chat/stream`
2. WHEN a client connects to the SSE endpoint with a prompt, THE Backend SHALL establish a Stream_Connection
3. THE Backend SHALL send message chunks through the Stream_Connection using SSE format
4. WHEN the stream completes, THE Backend SHALL close the Stream_Connection
5. THE Backend SHALL require authentication for the SSE endpoint
6. THE Backend SHALL validate the prompt parameter before processing

### Requirement 4: 前端 SSE 连接管理

**User Story:** 作为用户，我希望系统能够高效管理 SSE 连接，避免重复连接和资源浪费。

#### Acceptance Criteria

1. THE Frontend_Renderer SHALL create only one Stream_Connection per AI chat request
2. WHEN a Stream_Connection is active, THE Frontend_Renderer SHALL prevent creating duplicate connections
3. WHEN the user navigates away or closes the chat, THE Frontend_Renderer SHALL close the active Stream_Connection
4. WHEN a Stream_Connection fails, THE Frontend_Renderer SHALL display an error message and allow retry
5. THE Frontend_Renderer SHALL reuse the same EventSource instance until the stream completes

### Requirement 5: 流式内容渲染

**User Story:** 作为用户，我希望 AI 的回复能够逐字显示，提供流畅的阅读体验。

#### Acceptance Criteria

1. WHEN a message chunk is received, THE Frontend_Renderer SHALL append it to the displayed content immediately
2. THE Frontend_Renderer SHALL maintain proper text formatting during streaming
3. WHEN the stream completes, THE Frontend_Renderer SHALL mark the message as complete
4. THE Frontend_Renderer SHALL auto-scroll to show new content as it arrives
5. THE Frontend_Renderer SHALL display a typing indicator while streaming is active

### Requirement 6: Token 使用优化

**User Story:** 作为系统管理员，我希望系统能够避免浪费 LLM API tokens，以控制成本。

#### Acceptance Criteria

1. THE Frontend_Renderer SHALL not create duplicate Stream_Connections for the same prompt
2. WHEN a user cancels a request, THE Frontend_Renderer SHALL close the Stream_Connection immediately
3. THE Backend SHALL not process duplicate requests with identical prompts within a short time window
4. THE Backend SHALL log token usage for monitoring purposes
5. THE Backend SHALL implement rate limiting to prevent abuse

### Requirement 7: 错误处理

**User Story:** 作为用户，我希望在 AI 服务出现问题时能够收到清晰的错误提示。

#### Acceptance Criteria

1. WHEN the LLM API is unavailable, THE Backend SHALL return a user-friendly error message
2. WHEN the API key is invalid, THE Backend SHALL return an authentication error
3. WHEN the prompt is empty or invalid, THE Backend SHALL return a validation error
4. WHEN the stream is interrupted, THE Frontend_Renderer SHALL display a reconnection option
5. IF an error occurs during streaming, THEN THE Backend SHALL send an error event through SSE before closing

### Requirement 8: 用户界面集成

**User Story:** 作为用户，我希望能够在聊天界面中方便地与 AI 对话。

#### Acceptance Criteria

1. THE Frontend SHALL provide a dedicated AI chat interface or integrate AI into existing chat
2. WHEN a user types a message to AI, THE Frontend SHALL clearly indicate it's an AI conversation
3. THE Frontend SHALL display AI responses with distinct styling from human messages
4. THE Frontend SHALL show a loading state while waiting for the first chunk
5. THE Frontend SHALL allow users to stop an ongoing AI response

### Requirement 9: 消息持久化

**User Story:** 作为用户，我希望 AI 对话历史能够被保存，以便日后查看。

#### Acceptance Criteria

1. WHEN an AI response completes, THE Backend SHALL save the complete message to the database
2. THE Backend SHALL associate AI messages with the user who initiated the request
3. THE Backend SHALL store both the user prompt and AI response
4. WHEN a user views chat history, THE Frontend SHALL display AI conversations alongside regular messages
5. THE Backend SHALL mark AI messages with a special type identifier

### Requirement 10: 安全性

**User Story:** 作为系统管理员，我希望 AI 功能具有适当的安全控制。

#### Acceptance Criteria

1. THE Backend SHALL validate and sanitize all user prompts before sending to the LLM
2. THE Backend SHALL implement rate limiting per user to prevent abuse
3. THE Backend SHALL not expose the LLM API key to the frontend
4. THE Backend SHALL log all AI requests for audit purposes
5. THE Backend SHALL implement content filtering for inappropriate prompts

## Implementation Notes

### Technology Stack
- **Backend**: NestJS with Fastify
- **LLM Client**: LangChain's ChatOpenAI
- **LLM Provider**: Groq (llama-3.3-70b-versatile)
- **Streaming Protocol**: Server-Sent Events (SSE)
- **Frontend**: React with EventSource API

### API Key
- Groq API Key: `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`
- Base URL: `https://api.groq.com/openai/v1`

### Key Considerations
1. **Connection Management**: Use singleton pattern for SSE connections to avoid duplicates
2. **Token Efficiency**: Close connections immediately when not needed
3. **Error Recovery**: Implement graceful degradation when LLM service is unavailable
4. **Performance**: Stream chunks as soon as they arrive, don't buffer
5. **User Experience**: Show immediate feedback and smooth rendering

## Success Criteria

1. Users can send prompts to AI and receive streaming responses
2. No duplicate SSE connections are created for the same request
3. Frontend renders AI responses smoothly in real-time
4. Token usage is optimized and monitored
5. Error handling provides clear feedback to users
6. AI conversations are persisted and retrievable
7. System handles concurrent AI requests efficiently
8. Rate limiting prevents abuse
9. All security requirements are met
10. Integration with existing IM system is seamless
