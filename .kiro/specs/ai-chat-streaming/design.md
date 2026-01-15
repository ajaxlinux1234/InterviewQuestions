# Design Document: AI Chat Streaming

## Overview

本设计文档描述了 AI 聊天流式输出功能的技术实现方案。系统将集成 Groq 的 LLM API，通过 Server-Sent Events (SSE) 实现流式响应，前端使用 EventSource API 实时渲染 AI 回复。

核心设计目标：
- 高效的流式数据传输
- 避免重复连接和 token 浪费
- 流畅的用户体验
- 完善的错误处理
- 与现有 IM 系统无缝集成

## Architecture

### System Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │   Backend    │         │  Groq API   │
│   (React)   │         │  (NestJS)    │         │   (LLM)     │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  1. POST /ai/chat     │                        │
       │─────────────────────>│                        │
       │                       │                        │
       │  2. SSE Connection    │                        │
       │<─────────────────────│                        │
       │                       │  3. Stream Request     │
       │                       │───────────────────────>│
       │                       │                        │
       │                       │  4. Chunk 1            │
       │  5. data: chunk1      │<───────────────────────│
       │<─────────────────────│                        │
       │                       │                        │
       │                       │  6. Chunk 2            │
       │  7. data: chunk2      │<───────────────────────│
       │<─────────────────────│                        │
       │                       │                        │
       │       ...             │       ...              │
       │                       │                        │
       │  N. event: done       │                        │
       │<─────────────────────│                        │
       │                       │                        │
       │  Close Connection     │                        │
       │                       │                        │
```

### Component Architecture

```
Backend:
┌────────────────────────────────────────────────────┐
│                  AI Module                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ AiController │─>│ AiService   │─>│ LLM      │ │
│  │              │  │             │  │ Client   │ │
│  └──────────────┘  └─────────────┘  └──────────┘ │
│         │                 │                │       │
│         │                 │                │       │
│  ┌──────▼─────┐  ┌───────▼──────┐  ┌──────▼────┐ │
│  │ Auth Guard │  │ Rate Limiter │  │ Message   │ │
│  │            │  │              │  │ Repository│ │
│  └────────────┘  └──────────────┘  └───────────┘ │
└────────────────────────────────────────────────────┘

Frontend:
┌────────────────────────────────────────────────────┐
│              AI Chat Component                     │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │ AiChatPage   │─>│ AiMessage   │  │ SSE      │ │
│  │              │  │ Renderer    │<─│ Service  │ │
│  └──────────────┘  └─────────────┘  └──────────┘ │
│         │                 │                │       │
│  ┌──────▼─────┐  ┌───────▼──────┐         │       │
│  │ Input      │  │ Message      │         │       │
│  │ Component  │  │ List         │         │       │
│  └────────────┘  └──────────────┘         │       │
└────────────────────────────────────────────┼───────┘
                                             │
                                    ┌────────▼────────┐
                                    │  EventSource    │
                                    │  (Browser API)  │
                                    └─────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. AiModule

NestJS 模块，封装所有 AI 相关功能。

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [AiController],
  providers: [AiService, LlmClient],
  exports: [AiService],
})
export class AiModule {}
```

#### 2. LlmClient

封装 LangChain 的 ChatOpenAI 客户端。

```typescript
interface LlmClientConfig {
  apiKey: string;
  baseURL: string;
  modelName: string;
  streaming: boolean;
}

class LlmClient {
  private model: ChatOpenAI;
  
  constructor(config: LlmClientConfig);
  
  // 生成流式响应
  async *generateStream(prompt: string): AsyncGenerator<string>;
}
```

#### 3. AiService

核心业务逻辑服务。

```typescript
interface StreamChunk {
  type: 'chunk' | 'done' | 'error';
  content: string;
  timestamp: number;
}

class AiService {
  constructor(
    private llmClient: LlmClient,
    private messageRepository: Repository<Message>,
  );
  
  // 生成流式响应
  async *streamResponse(
    userId: number,
    prompt: string,
  ): AsyncGenerator<StreamChunk>;
  
  // 保存完整对话
  async saveConversation(
    userId: number,
    prompt: string,
    response: string,
  ): Promise<void>;
  
  // 验证和清理提示词
  validateAndSanitizePrompt(prompt: string): string;
}
```

#### 4. AiController

处理 HTTP 请求和 SSE 连接。

```typescript
@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(private aiService: AiService);
  
  // SSE 端点
  @Get('chat/stream')
  @Sse()
  async streamChat(
    @Query('prompt') prompt: string,
    @Request() req,
  ): Promise<Observable<MessageEvent>>;
}
```

### Frontend Components

#### 1. SSE Service

管理 SSE 连接的单例服务。

```typescript
interface SseConnectionOptions {
  url: string;
  onMessage: (data: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

class SseService {
  private activeConnection: EventSource | null = null;
  private connectionPrompt: string | null = null;
  
  // 创建 SSE 连接（防止重复）
  connect(options: SseConnectionOptions): void;
  
  // 关闭当前连接
  disconnect(): void;
  
  // 检查是否有活动连接
  isConnected(): boolean;
  
  // 获取当前连接的提示词
  getCurrentPrompt(): string | null;
}
```

#### 2. AI Chat Component

AI 聊天界面组件。

```typescript
interface AiChatProps {
  conversationId?: number;
}

interface AiMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  isStreaming: boolean;
  timestamp: number;
}

function AiChatPage(props: AiChatProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);
  
  // 发送提示词
  const sendPrompt = (prompt: string) => void;
  
  // 停止当前流
  const stopStreaming = () => void;
  
  // 处理流式消息
  const handleStreamChunk = (chunk: string) => void;
}
```

#### 3. AI Message Renderer

渲染 AI 消息的组件。

```typescript
interface AiMessageProps {
  message: AiMessage;
  onStop?: () => void;
}

function AiMessageRenderer(props: AiMessageProps) {
  // 渲染消息内容
  // 显示流式指示器
  // 提供停止按钮
}
```

## Data Models

### Message Entity (Extended)

扩展现有的 Message 实体以支持 AI 消息。

```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  conversationId: number;
  
  @Column({ nullable: true })
  senderId: number; // null for AI messages
  
  @Column('text')
  content: string;
  
  @Column({
    type: 'enum',
    enum: ['text', 'image', 'file', 'ai_prompt', 'ai_response'],
    default: 'text',
  })
  type: string;
  
  @Column({ nullable: true })
  aiPromptId: number; // Link AI response to its prompt
  
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    model?: string;
    tokenCount?: number;
    streamDuration?: number;
  };
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;
}
```

### AI Request Log

记录 AI 请求用于审计和监控。

```typescript
@Entity('ai_request_logs')
export class AiRequestLog {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  userId: number;
  
  @Column('text')
  prompt: string;
  
  @Column('text', { nullable: true })
  response: string;
  
  @Column()
  model: string;
  
  @Column({ nullable: true })
  tokenCount: number;
  
  @Column({ nullable: true })
  duration: number; // milliseconds
  
  @Column({ default: 'success' })
  status: 'success' | 'error' | 'cancelled';
  
  @Column('text', { nullable: true })
  errorMessage: string;
  
  @CreateDateColumn()
  createdAt: Date;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Streaming Response Generation

*For any* valid user prompt, when sent to the AI service, the system should generate a streaming response with at least one chunk before completion.

**Validates: Requirements 2.1, 2.2**

### Property 2: Stream Closure

*For any* AI stream (successful or failed), the stream connection should be properly closed when complete, with no resource leaks.

**Validates: Requirements 2.3, 2.4**

### Property 3: SSE Format Compliance

*For any* message chunk sent through the stream, it should be formatted as valid SSE data (starting with "data: " and ending with "\n\n").

**Validates: Requirements 2.5, 3.3**

### Property 4: Single Connection Per Request

*For any* AI chat request, the frontend should create exactly one SSE connection, and prevent duplicate connections while that connection is active.

**Validates: Requirements 4.1, 4.2, 6.1**

### Property 5: Connection Reuse

*For any* streaming session, the same EventSource instance should be used for all chunks until the stream completes.

**Validates: Requirements 4.5**

### Property 6: Prompt Validation

*For any* invalid prompt (empty, too long, or containing only whitespace), the backend should reject it with a validation error before sending to the LLM.

**Validates: Requirements 3.6, 7.3**

### Property 7: Chunk Appending

*For any* received message chunk, the frontend should append it to the displayed content immediately without replacing previous content.

**Validates: Requirements 5.1**

### Property 8: Text Formatting Preservation

*For any* streamed content containing formatting (newlines, spaces, special characters), the formatting should be preserved in the rendered output.

**Validates: Requirements 5.2**

### Property 9: Stream Completion Marking

*For any* completed AI response stream, the message should be marked as complete (isStreaming = false) in the UI state.

**Validates: Requirements 5.3**

### Property 10: Auto-scroll Behavior

*For any* new chunk appended during streaming, if the user is near the bottom of the message list, the view should auto-scroll to show the new content.

**Validates: Requirements 5.4**

### Property 11: Typing Indicator

*For any* active streaming session, a typing indicator should be visible in the UI, and hidden when the stream completes or errors.

**Validates: Requirements 5.5**

### Property 12: Request Deduplication

*For any* prompt, if an identical prompt is submitted within a 5-second window, the backend should reject the duplicate request.

**Validates: Requirements 6.3**

### Property 13: Rate Limiting

*For any* user, if they exceed the rate limit (e.g., 10 requests per minute), subsequent requests should be rejected with a rate limit error.

**Validates: Requirements 6.5, 10.2**

### Property 14: Error Event Transmission

*For any* error occurring during streaming, the backend should send an error event through SSE before closing the connection.

**Validates: Requirements 7.5**

### Property 15: AI Message Styling

*For any* AI-generated message displayed in the UI, it should have distinct styling (different from user messages) to clearly indicate it's from AI.

**Validates: Requirements 8.2, 8.3**

### Property 16: Loading State

*For any* AI request, a loading state should be displayed from the moment the request is sent until the first chunk is received.

**Validates: Requirements 8.4**

### Property 17: Message Persistence

*For any* completed AI response, both the user prompt and AI response should be saved to the database with correct associations.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 18: AI Message Type Marking

*For any* AI message saved to the database, it should have a type field set to 'ai_prompt' or 'ai_response' to distinguish it from regular messages.

**Validates: Requirements 9.5**

### Property 19: Prompt Sanitization

*For any* user prompt, it should be validated and sanitized (removing potentially harmful content) before being sent to the LLM.

**Validates: Requirements 10.1**

### Property 20: Audit Logging

*For any* AI request (successful or failed), an audit log entry should be created with the prompt, response, user ID, and timestamp.

**Validates: Requirements 10.4**

### Property 21: Content Filtering

*For any* prompt containing inappropriate content (profanity, harmful requests), it should be filtered or rejected before processing.

**Validates: Requirements 10.5**

## Error Handling

### Error Types

1. **API Errors**
   - Invalid API key → 401 Unauthorized
   - API unavailable → 503 Service Unavailable
   - Rate limit exceeded → 429 Too Many Requests

2. **Validation Errors**
   - Empty prompt → 400 Bad Request
   - Prompt too long → 400 Bad Request
   - Invalid characters → 400 Bad Request

3. **Stream Errors**
   - Connection interrupted → Send error event, allow retry
   - LLM timeout → Send timeout event, close stream
   - Unexpected LLM error → Send error event, log details

4. **Client Errors**
   - Network failure → Display retry button
   - SSE not supported → Fallback to polling (optional)
   - Connection timeout → Display reconnect option

### Error Handling Strategy

```typescript
// Backend error handling
try {
  for await (const chunk of llmStream) {
    yield { type: 'chunk', content: chunk };
  }
  yield { type: 'done' };
} catch (error) {
  yield {
    type: 'error',
    content: getUserFriendlyErrorMessage(error),
  };
  logError(error);
}

// Frontend error handling
eventSource.onerror = (error) => {
  setIsStreaming(false);
  setError('连接中断，请重试');
  sseService.disconnect();
};
```

## Testing Strategy

### Unit Tests

1. **LlmClient Tests**
   - Test API configuration
   - Test stream generation with mock responses
   - Test error handling for API failures

2. **AiService Tests**
   - Test prompt validation and sanitization
   - Test message persistence
   - Test rate limiting logic
   - Test deduplication logic

3. **AiController Tests**
   - Test SSE endpoint authentication
   - Test SSE response format
   - Test error responses

4. **Frontend Component Tests**
   - Test message rendering
   - Test streaming state management
   - Test error display
   - Test stop functionality

### Property-Based Tests

Each property test should run a minimum of 100 iterations and be tagged with:
**Feature: ai-chat-streaming, Property {number}: {property_text}**

1. **Property 1 Test**: Generate random valid prompts, verify all produce streams
2. **Property 3 Test**: Verify all chunks match SSE format regex
3. **Property 4 Test**: Attempt to create multiple connections, verify only one succeeds
4. **Property 6 Test**: Generate random invalid prompts, verify all are rejected
5. **Property 7 Test**: Send random chunks, verify all are appended (not replaced)
6. **Property 12 Test**: Send duplicate prompts within time window, verify rejection
7. **Property 13 Test**: Send requests exceeding rate limit, verify rejection
8. **Property 17 Test**: Complete random AI conversations, verify all are persisted
9. **Property 19 Test**: Generate prompts with various special characters, verify sanitization
10. **Property 21 Test**: Generate prompts with inappropriate content, verify filtering

### Integration Tests

1. **End-to-End Streaming**
   - Send prompt → Receive chunks → Verify completion
   - Test with real Groq API (in staging)

2. **Connection Management**
   - Test connection cleanup on navigation
   - Test connection cleanup on error
   - Test connection reuse

3. **Database Integration**
   - Test message persistence
   - Test audit logging
   - Test message retrieval

### Manual Testing Checklist

- [ ] Send various prompts and verify smooth streaming
- [ ] Test stop button during streaming
- [ ] Test navigation away during streaming
- [ ] Test error scenarios (invalid API key, network failure)
- [ ] Verify no duplicate connections in browser DevTools
- [ ] Verify token usage is logged correctly
- [ ] Test rate limiting by sending many requests
- [ ] Verify AI messages display with correct styling
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

## Security Considerations

1. **API Key Protection**
   - Store API key in environment variables
   - Never expose in frontend code or API responses
   - Use server-side only

2. **Authentication**
   - Require valid JWT token for all AI endpoints
   - Validate user identity before processing requests

3. **Rate Limiting**
   - Implement per-user rate limiting (10 requests/minute)
   - Implement global rate limiting (100 requests/minute)
   - Use Redis for distributed rate limiting

4. **Input Validation**
   - Sanitize all user inputs
   - Limit prompt length (max 2000 characters)
   - Filter inappropriate content
   - Prevent injection attacks

5. **Audit Logging**
   - Log all AI requests with user ID and timestamp
   - Log token usage for cost monitoring
   - Log errors for debugging

6. **Content Filtering**
   - Implement basic profanity filter
   - Reject prompts requesting harmful content
   - Log filtered requests for review

## Performance Considerations

1. **Streaming Optimization**
   - Send chunks immediately as received (no buffering)
   - Use efficient SSE format
   - Minimize chunk processing overhead

2. **Connection Management**
   - Reuse EventSource instances
   - Close connections promptly when done
   - Implement connection pooling if needed

3. **Database Optimization**
   - Batch insert for audit logs
   - Index on userId and createdAt for queries
   - Use async operations for persistence

4. **Caching**
   - Consider caching common prompts (optional)
   - Cache rate limit counters in Redis
   - Cache user authentication state

5. **Resource Limits**
   - Set timeout for LLM requests (30 seconds)
   - Limit concurrent streams per user (1)
   - Limit total concurrent streams (50)

## Deployment Considerations

1. **Environment Variables**
   ```
   GROQ_API_KEY=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
   GROQ_BASE_URL=https://api.groq.com/openai/v1
   GROQ_MODEL=llama-3.3-70b-versatile
   AI_RATE_LIMIT_PER_USER=10
   AI_RATE_LIMIT_WINDOW=60000
   AI_MAX_PROMPT_LENGTH=2000
   ```

2. **Dependencies**
   ```json
   {
     "@langchain/openai": "^0.0.14",
     "langchain": "^0.1.0",
     "rxjs": "^7.8.0"
   }
   ```

3. **Database Migrations**
   - Add `type` column to messages table
   - Add `aiPromptId` column to messages table
   - Add `metadata` column to messages table
   - Create `ai_request_logs` table

4. **Monitoring**
   - Monitor token usage
   - Monitor error rates
   - Monitor response times
   - Monitor concurrent connections
   - Set up alerts for anomalies

## Future Enhancements

1. **Conversation Context**
   - Support multi-turn conversations
   - Maintain conversation history
   - Allow users to reference previous messages

2. **Model Selection**
   - Allow users to choose different models
   - Support multiple LLM providers
   - A/B test different models

3. **Advanced Features**
   - Support for code highlighting in responses
   - Support for markdown rendering
   - Support for image generation
   - Support for file attachments

4. **Analytics**
   - Track user engagement with AI
   - Analyze common prompts
   - Measure response quality
   - Generate usage reports

5. **Optimization**
   - Implement response caching
   - Use WebSocket for bidirectional communication
   - Implement request queuing for high load
   - Add CDN for static assets
