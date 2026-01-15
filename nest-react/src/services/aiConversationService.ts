/**
 * AI 会话服务
 * 
 * 管理 AI 助手的会话列表和历史记录
 */

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7002';

export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  summary?: string;
  messageCount: number;
  status: string;
  metadata?: {
    model?: string;
    lastPrompt?: string;
    tags?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface AiConversationDetail extends AiConversation {
  messages: AiMessage[];
}

export interface AiMessage {
  id: number;
  senderId?: number;
  aiConversationId?: number;
  type: 'ai_prompt' | 'ai_response';
  content: string;
  metadata?: {
    model?: string;
    responseLength?: number;
    timestamp?: number;
  };
  createdAt: string;
  updatedAt: string;
}

class AiConversationService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  /**
   * 创建新会话
   */
  async createConversation(title?: string): Promise<AiConversation> {
    const response = await fetch(`${API_BASE_URL}/ai/conversations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * 获取会话列表
   */
  async getConversations(status: string = 'active', limit: number = 50): Promise<AiConversation[]> {
    const response = await fetch(
      `${API_BASE_URL}/ai/conversations?status=${status}&limit=${limit}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversations: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * 获取会话详情（包含消息历史）
   */
  async getConversationDetail(conversationId: number, limit: number = 100): Promise<AiConversationDetail> {
    const response = await fetch(
      `${API_BASE_URL}/ai/conversations/${conversationId}?limit=${limit}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get conversation detail: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * 更新会话标题
   */
  async updateConversationTitle(conversationId: number, title: string): Promise<AiConversation> {
    const response = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update conversation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * 删除会话
   */
  async deleteConversation(conversationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`);
    }
  }

  /**
   * 归档会话
   */
  async archiveConversation(conversationId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}/archive`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to archive conversation: ${response.statusText}`);
    }
  }
}

export const aiConversationService = new AiConversationService();
