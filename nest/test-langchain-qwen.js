/**
 * 测试 LangChain 与通义千问集成
 */

require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

console.log('🔍 测试 LangChain 与通义千问集成...\n');

const API_KEY = process.env.GROQ_API_KEY || 'sk-05c31220158d49cea02ce2b544c91288';
const BASE_URL = process.env.GROQ_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const MODEL = process.env.GROQ_MODEL || 'qwen-plus';

console.log('📋 配置信息:');
console.log(`   API Key: ${API_KEY.substring(0, 20)}...`);
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   Model: ${MODEL}\n`);

async function testLangChain() {
  try {
    console.log('🚀 初始化 ChatOpenAI...');
    
    const model = new ChatOpenAI({
      apiKey: API_KEY,
      model: MODEL,
      streaming: false,
      temperature: 0.7,
      configuration: {
        baseURL: BASE_URL,
      },
      maxRetries: 2,
      timeout: 30000,
    });

    console.log('✅ ChatOpenAI 初始化成功\n');
    console.log('📤 发送测试消息...');
    
    const response = await model.invoke('你好，请回复"LangChain 集成测试成功"');
    
    console.log('✅ 收到响应！\n');
    console.log('📝 AI 响应:');
    console.log(`   ${response.content}\n`);
    console.log('🎉 LangChain 与通义千问集成成功！');
    
  } catch (error) {
    console.error('❌ 测试失败:');
    console.error(`   错误: ${error.message}`);
    console.error(`   详情: ${error.stack}\n`);
    
    if (error.message.includes('401')) {
      console.log('💡 API Key 无效');
    } else if (error.message.includes('403')) {
      console.log('💡 API Key 权限不足');
    } else if (error.message.includes('timeout')) {
      console.log('💡 请求超时');
    }
    
    process.exit(1);
  }
}

testLangChain();
