/**
 * SSE Service - AI 聊天流式连接服务
 * 
 * 单例模式，管理 SSE 连接，防止重复连接
 */

export interface SSEChunk {
  type: 'start' | 'chunk' | 'done' | 'error';
  content: string;
  timestamp: number;
  metadata?: {
    chunkIndex?: number;
    totalChunks?: number;
  };
  requestId?: string;
}

export interface SSECallbacks {
  onStart?: (data: SSEChunk) => void;
  onChunk?: (data: SSEChunk) => void;
  onDone?: (data: SSEChunk) => void;
  onError?: (error: string, data?: SSEChunk) => void;
  onClose?: () => void;
}

class SSEService {
  private static instance: SSEService;
  private eventSource: EventSource | null = null;
  private currentPrompt: string | null = null;
  private isConnecting: boolean = false;

  private constructor() {
    // 私有构造函数，确保单例
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): SSEService {
    if (!SSEService.instance) {
      SSEService.instance = new SSEService();
    }
    return SSEService.instance;
  }

  /**
   * 检查是否已连接
   */
  public isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * 检查是否正在连接
   */
  public isConnectingNow(): boolean {
    return this.isConnecting;
  }

  /**
   * 获取当前连接的提示词
   */
  public getCurrentPrompt(): string | null {
    return this.currentPrompt;
  }

  /**
   * 连接到 SSE 端点
   * 
   * @param prompt 用户提示词
   * @param token 认证 token
   * @param callbacks 回调函数
   * @param conversationId 会话 ID（可选）
   * @returns Promise<void>
   */
  public async connect(
    prompt: string,
    token: string,
    callbacks: SSECallbacks,
    conversationId?: number,
  ): Promise<void> {
    // 防止重复连接
    if (this.isConnected() || this.isConnecting) {
      console.warn('[SSEService] Already connected or connecting, disconnecting first');
      await this.disconnect();
    }

    // 验证参数
    if (!prompt || typeof prompt !== 'string') {
      const error = 'Prompt is required and must be a string';
      console.error('[SSEService]', error);
      callbacks.onError?.(error);
      return;
    }

    if (!token || typeof token !== 'string') {
      const error = 'Authentication token is required';
      console.error('[SSEService]', error);
      callbacks.onError?.(error);
      return;
    }

    this.isConnecting = true;
    this.currentPrompt = prompt;

    try {
      // 构建 URL
      const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:7001';
      const url = new URL(`${baseUrl}/ai/chat/stream`);
      url.searchParams.append('prompt', prompt);
      if (conversationId) {
        url.searchParams.append('conversationId', conversationId.toString());
      }

      console.log('[SSEService] Connecting to:', url.toString());

      // 创建 EventSource
      // 注意: EventSource 不支持自定义 headers，所以我们通过 URL 参数传递 token
      // 或者使用 fetch + ReadableStream (更复杂但更灵活)
      // 这里我们使用 fetch + ReadableStream 方式以支持 Authorization header
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      this.isConnecting = false;

      // 读取流
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('[SSEService] Stream ended');
              callbacks.onClose?.();
              this.cleanup();
              break;
            }

            // 解码数据
            buffer += decoder.decode(value, { stream: true });

            // 处理 SSE 消息
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 保留不完整的行

            for (const line of lines) {
              if (line.startsWith('event:')) {
                // 事件类型行，暂时忽略（我们从 data 中解析 type）
                continue;
              }

              if (line.startsWith('data:')) {
                const data = line.substring(5).trim();
                
                if (!data) {
                  continue;
                }

                try {
                  const parsed = JSON.parse(data) as SSEChunk;
                  this.handleMessage(parsed, callbacks);
                } catch (error) {
                  console.error('[SSEService] Failed to parse SSE data:', error, data);
                }
              }
            }
          }
        } catch (error) {
          console.error('[SSEService] Stream processing error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Stream processing failed';
          callbacks.onError?.(errorMessage);
          this.cleanup();
        }
      };

      // 启动流处理
      processStream();

    } catch (error) {
      console.error('[SSEService] Connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      callbacks.onError?.(errorMessage);
      this.isConnecting = false;
      this.cleanup();
    }
  }

  /**
   * 处理 SSE 消息
   */
  private handleMessage(data: SSEChunk, callbacks: SSECallbacks): void {
    console.log('[SSEService] Received message:', data.type, data);

    switch (data.type) {
      case 'start':
        callbacks.onStart?.(data);
        break;

      case 'chunk':
        callbacks.onChunk?.(data);
        break;

      case 'done':
        console.log('[SSEService] Calling onDone callback');
        callbacks.onDone?.(data);
        console.log('[SSEService] onDone callback completed, cleaning up');
        this.cleanup();
        break;

      case 'error':
        callbacks.onError?.(data.content || 'Unknown error', data);
        this.cleanup();
        break;

      default:
        console.warn('[SSEService] Unknown message type:', data.type);
    }
  }

  /**
   * 断开连接
   */
  public async disconnect(): Promise<void> {
    console.log('[SSEService] Disconnecting');
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.cleanup();
  }

  /**
   * 清理状态
   */
  private cleanup(): void {
    this.currentPrompt = null;
    this.isConnecting = false;
    this.eventSource = null;
  }

  /**
   * 获取连接状态信息（用于调试）
   */
  public getStatus(): {
    isConnected: boolean;
    isConnecting: boolean;
    currentPrompt: string | null;
  } {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      currentPrompt: this.currentPrompt,
    };
  }
}

// 导出单例实例
export const sseService = SSEService.getInstance();
