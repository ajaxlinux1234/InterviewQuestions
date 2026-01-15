/**
 * Groq API 连接测试脚本
 * 
 * 用于验证 Groq API 配置是否正确
 */

require('dotenv').config();
const { ChatOpenAI } = require('@langchain/openai');

async function testGroqConnection() {
  console.log('🔍 测试 Groq API 连接...\n');
  
  // 检查环境变量
  console.log('📋 环境变量检查:');
  console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
  console.log(`   GROQ_BASE_URL: ${process.env.GROQ_BASE_URL || '❌ 未设置'}`);
  console.log(`   GROQ_MODEL: ${process.env.GROQ_MODEL || '❌ 未设置'}`);
  console.log('');
  
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ 错误: GROQ_API_KEY 未设置');
    process.exit(1);
  }
  
  try {
    // 创建 LLM 客户端
    console.log('🤖 创建 LLM 客户端...');
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
    console.log('✅ LLM 客户端创建成功\n');
    
    // 测试简单请求
    console.log('📤 发送测试请求: "Say hello in one sentence"');
    console.log('📥 流式响应:\n');
    
    const stream = await model.stream('Say hello in one sentence');
    
    let fullResponse = '';
    let chunkCount = 0;
    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
        chunkCount++;
      }
    }
    
    console.log('\n');
    console.log('✅ 测试成功！');
    console.log(`📊 响应长度: ${fullResponse.length} 字符`);
    console.log(`📦 接收块数: ${chunkCount} 个`);
    console.log('');
    console.log('🎉 Groq API 连接正常，可以开始开发了！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:');
    console.error(`   错误类型: ${error.name}`);
    console.error(`   错误信息: ${error.message}`);
    
    if (error.response) {
      console.error(`   HTTP 状态: ${error.response.status}`);
      console.error(`   响应数据: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    console.log('\n💡 可能的原因:');
    console.log('   1. API Key 无效或已过期');
    console.log('   2. 网络连接问题');
    console.log('   3. Groq API 服务不可用');
    console.log('   4. Base URL 配置错误');
    
    process.exit(1);
  }
}

// 运行测试
testGroqConnection();
