# AI Chat Streaming 设置指南

## 已完成的配置

### 1. 依赖安装 ✅

已安装以下依赖：
- `@langchain/openai@1.2.2` - LangChain 的 OpenAI 客户端
- `langchain@1.2.10` - LangChain 核心库
- `dotenv@17.2.3` - 环境变量加载

### 2. 环境变量配置 ✅

已创建 `.env` 文件，包含以下配置：

```env
# Groq AI Configuration
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.3-70b-versatile

# AI Service Configuration
AI_RATE_LIMIT_PER_USER=10
AI_RATE_LIMIT_WINDOW=60000
AI_MAX_PROMPT_LENGTH=2000
AI_REQUEST_TIMEOUT=30000
```

### 3. 测试脚本 ✅

已创建 `test-groq-connection.js` 用于验证 API 连接。

## ⚠️ API Key 问题

当前提供的 API Key 返回 403 Forbidden 错误，可能的原因：
1. API Key 已过期
2. API Key 权限不足
3. API Key 已被撤销
4. 需要从 Groq 控制台重新生成

## 下一步操作

### 获取新的 API Key

1. 访问 [Groq Console](https://console.groq.com/)
2. 登录或注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 更新 `.env` 文件中的 `GROQ_API_KEY`

### 验证 API 连接

运行测试脚本：

```bash
cd nest
node test-groq-connection.js
```

成功的输出应该类似：

```
🔍 测试 Groq API 连接...

📋 环境变量检查:
   GROQ_API_KEY: ✅ 已设置
   GROQ_BASE_URL: https://api.groq.com/openai/v1
   GROQ_MODEL: llama-3.3-70b-versatile

🤖 创建 LLM 客户端...
✅ LLM 客户端创建成功

📤 发送测试请求: "Say hello in one sentence"
📥 流式响应:

Hello! I'm LLaMA, a helpful AI assistant.

✅ 测试成功！
📊 响应长度: 42 字符
📦 接收块数: 8 个

🎉 Groq API 连接正常，可以开始开发了！
```

## LangChain 配置说明

### ChatOpenAI 客户端配置

```typescript
import { ChatOpenAI } from '@langchain/openai';

const model = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.GROQ_MODEL,
  streaming: true,
  temperature: 0.7,
  configuration: {
    baseURL: process.env.GROQ_BASE_URL,
  },
  maxRetries: 2,
  timeout: 10000,
});
```

### 流式响应使用

```typescript
const stream = await model.stream('Your prompt here');

for await (const chunk of stream) {
  const content = chunk.content;
  if (content) {
    // 处理每个块
    console.log(content);
  }
}
```

## 项目结构

```
nest/
├── .env                        # 环境变量配置
├── test-groq-connection.js     # API 连接测试脚本
├── AI_SETUP.md                 # 本文档
└── src/
    └── (待创建的 AI 模块)
```

## 相关文档

- [LangChain 文档](https://js.langchain.com/docs/)
- [Groq API 文档](https://console.groq.com/docs)
- [ChatOpenAI 配置](https://js.langchain.com/docs/integrations/chat/openai)

## 故障排除

### 403 Forbidden

- 检查 API Key 是否有效
- 确认 API Key 有正确的权限
- 尝试重新生成 API Key

### 超时错误

- 检查网络连接
- 增加 timeout 配置
- 检查 Groq API 服务状态

### 其他错误

- 查看完整的错误信息
- 检查 Base URL 是否正确
- 确认模型名称是否正确
