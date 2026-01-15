/**
 * LLM 客户端
 * 
 * 封装 LangChain 的 ChatOpenAI 客户端，用于与 Groq API 交互
 */

import { Injectable, Logger } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConfigService } from '@nestjs/config';
import { ProxyAgent } from 'undici';

export interface LlmClientConfig {
  apiKey: string;
  baseURL: string;
  modelName: string;
  streaming: boolean;
  temperature?: number;
  maxRetries?: number;
  timeout?: number;
  httpProxy?: string;
  httpsProxy?: string;
}

export interface StreamChunk {
  content: string;
  timestamp: number;
}

@Injectable()
export class LlmClient {
  private readonly logger = new Logger(LlmClient.name);
  private model: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.initializeModel();
  }

  /**
   * 初始化 LLM 模型
   */
  private initializeModel(): void {
    const config: LlmClientConfig = {
      apiKey: this.configService.get<string>('GROQ_API_KEY'),
      baseURL: this.configService.get<string>('GROQ_BASE_URL'),
      modelName: this.configService.get<string>('GROQ_MODEL'),
      streaming: true,
      temperature: 0.7,
      maxRetries: 2,
      timeout: this.configService.get<number>('AI_REQUEST_TIMEOUT', 30000),
      httpProxy: this.configService.get<string>('HTTP_PROXY'),
      httpsProxy: this.configService.get<string>('HTTPS_PROXY'),
    };

    // 验证必需的配置
    if (!config.apiKey) {
      throw new Error('GROQ_API_KEY is required but not provided');
    }
    if (!config.baseURL) {
      throw new Error('GROQ_BASE_URL is required but not provided');
    }
    if (!config.modelName) {
      throw new Error('GROQ_MODEL is required but not provided');
    }

    // 配置代理（仅在配置了代理时使用）
    let customFetch: any = undefined;
    if (config.httpsProxy) {
      const proxyAgent = new ProxyAgent(config.httpsProxy);
      this.logger.log(`Using HTTPS proxy: ${config.httpsProxy}`);
      
      customFetch = (url: string, options: any = {}) => {
        return fetch(url, {
          ...options,
          dispatcher: proxyAgent,
        });
      };
    }

    this.model = new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.modelName,
      streaming: config.streaming,
      temperature: config.temperature,
      configuration: {
        baseURL: config.baseURL,
        ...(customFetch && { fetch: customFetch }),
      },
      maxRetries: config.maxRetries,
      timeout: config.timeout,
    });

    this.logger.log(`LLM Client initialized with model: ${config.modelName} at ${config.baseURL}`);
  }

  /**
   * 生成流式响应
   * 
   * @param prompt 用户提示词
   * @returns AsyncGenerator<StreamChunk> 流式响应块
   */
  async *generateStream(prompt: string): AsyncGenerator<StreamChunk> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    this.logger.debug(`Generating stream for prompt: ${prompt.substring(0, 100)}...`);

    try {
      const stream = await this.model.stream(prompt);
      
      for await (const chunk of stream) {
        const content = chunk.content;
        // 过滤空内容和只包含空白字符的内容
        if (content && typeof content === 'string' && content.trim().length > 0) {
          yield {
            content,
            timestamp: Date.now(),
          };
        }
      }

      this.logger.debug('Stream generation completed successfully');
    } catch (error) {
      this.logger.error(`Stream generation failed: ${error.message}`, error.stack);
      throw new Error(`LLM stream generation failed: ${error.message}`);
    }
  }

  /**
   * 生成单次响应（非流式）
   * 
   * @param prompt 用户提示词
   * @returns Promise<string> 完整响应
   */
  async generateResponse(prompt: string): Promise<string> {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    this.logger.debug(`Generating response for prompt: ${prompt.substring(0, 100)}...`);

    try {
      const response = await this.model.invoke(prompt);
      const content = response.content;

      if (typeof content !== 'string') {
        throw new Error('Unexpected response format from LLM');
      }

      this.logger.debug(`Response generated successfully, length: ${content.length}`);
      return content;
    } catch (error) {
      this.logger.error(`Response generation failed: ${error.message}`, error.stack);
      throw new Error(`LLM response generation failed: ${error.message}`);
    }
  }

  /**
   * 验证 API 连接
   * 
   * @returns Promise<boolean> 连接是否成功
   */
  async validateConnection(): Promise<boolean> {
    try {
      this.logger.debug('Validating LLM API connection...');
      
      const testPrompt = 'Hello, please respond with "OK" if you can hear me.';
      const response = await this.generateResponse(testPrompt);
      
      const isValid = response && response.length > 0;
      this.logger.log(`API connection validation: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      
      return isValid;
    } catch (error) {
      this.logger.error(`API connection validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取模型配置信息
   * 
   * @returns 模型配置信息
   */
  getModelInfo(): {
    modelName: string;
    baseURL: string;
    streaming: boolean;
    temperature: number;
  } {
    return {
      modelName: this.configService.get<string>('GROQ_MODEL'),
      baseURL: this.configService.get<string>('GROQ_BASE_URL'),
      streaming: true,
      temperature: 0.7,
    };
  }

  /**
   * 检查 API Key 是否已配置
   * 
   * @returns boolean API Key 是否存在
   */
  hasApiKey(): boolean {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    return !!(apiKey && apiKey.length > 0);
  }
}