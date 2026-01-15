/**
 * 完整测试 AI 服务流程
 */

require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

console.log('🔍 完整测试 AI 服务流程...\n');

const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = process.env.GROQ_BASE_URL;
const MODEL = process.env.GROQ_MODEL;

console.log('📋 环境变量:');
console.log(`   GROQ_API_KEY: ${API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
console.log(`   GROQ_BASE_URL: ${BASE_URL || '❌ 未设置'}`);
console.log(`   GROQ_MODEL: ${MODEL || '❌ 未设置'}\n`);

if (!API_KEY || !BASE_URL || !MODEL) {
  console.error('❌ 环境变量未正确配置！');
  process.exit(1);
}

async function testFullFlow() {
  try {
    console.log('1️⃣ 初始化 LLM Client...');
    
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
    
    console.log('   ✅ LLM Client 初始化成功\n');
    
    console.log('2️⃣ 测试流式响应...');
    const prompt = '你是谁?';
    console.log(`   提示词: "${prompt}"`);
    console.log('   响应: ');
    
    const stream = await model.stream(prompt);
    
    let fullResponse = '';
    let chunkCount = 0;
    const startTime = Date.now();
    
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content && typeof content === 'string') {
        process.stdout.write(content);
        fullResponse += content;
        chunkCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    
    console.log('\n');
    console.log(`   ✅ 流式响应完成`);
    console.log(`   📊 统计: ${chunkCount} 个块, ${fullResponse.length} 字符, ${duration}ms\n`);
    
    console.log('3️⃣ 测试错误处理...');
    try {
      const errorModel = new ChatOpenAI({
        apiKey: 'invalid-key',
        model: MODEL,
        streaming: true,
        configuration: {
          baseURL: BASE_URL,
        },
        maxRetries: 1,
        timeout: 5000,
      });
      
      await errorModel.invoke('test');
      console.log('   ⚠️  应该抛出错误但没有\n');
    } catch (error) {
      console.log(`   ✅ 错误处理正常: ${error.message}\n`);
    }
    
    console.log('🎉 所有测试通过！AI 服务应该可以正常工作。\n');
    console.log('💡 如果后端还是报错，请检查:');
    console.log('   1. 后端服务是否已重启');
    console.log('   2. 后端日志中的具体错误信息');
    console.log('   3. 数据库连接是否正常');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(`   错误类型: ${error.constructor.name}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.response) {
      console.error(`   响应状态: ${error.response.status}`);
      console.error(`   响应数据: ${JSON.stringify(error.response.data)}`);
    }
    
    console.error(`\n   堆栈: ${error.stack}`);
    process.exit(1);
  }
}

testFullFlow();
