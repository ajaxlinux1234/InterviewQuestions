/**
 * 测试 LangChain 流式响应
 */

require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

console.log('🔍 测试 LangChain 流式响应...\n');

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = process.env.GROQ_BASE_URL;
const MODEL = process.env.GROQ_MODEL;

async function testStream() {
  try {
    console.log('🚀 初始化 ChatOpenAI (streaming=true)...');
    
    const model = new ChatOpenAI({
      apiKey: API_KEY,
      model: MODEL,
      streaming: true,
      temperature: 0.7,
      configuration: {
        baseURL: BASE_URL,
      },
      maxRetries: 2,
      timeout: 30000,
    });

    console.log('✅ ChatOpenAI 初始化成功\n');
    console.log('📤 发送流式请求...');
    console.log('📝 AI 响应 (流式):\n');
    
    const stream = await model.stream('请用一句话介绍你自己');
    
    let chunkCount = 0;
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content && typeof content === 'string') {
        process.stdout.write(content);
        chunkCount++;
      }
    }
    
    console.log('\n');
    console.log(`✅ 流式响应完成！共收到 ${chunkCount} 个块\n`);
    console.log('🎉 LangChain 流式响应测试成功！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(`   错误: ${error.message}`);
    console.error(`   详情: ${error.stack}\n`);
    process.exit(1);
  }
}

testStream();
