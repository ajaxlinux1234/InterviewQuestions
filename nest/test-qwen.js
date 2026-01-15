/**
 * 测试阿里通义千问 API
 */

const { fetch: undiciFetch } = require('undici');

console.log('🔍 测试阿里通义千问 API...\n');

const API_KEY = 'sk-05c31220158d49cea02ce2b544c91288';
const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

async function testQwen() {
  try {
    console.log('🚀 发送测试请求到通义千问...');
    
    const response = await undiciFetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'user',
            content: '你好，请回复"连接测试成功"',
          },
        ],
      }),
    });

    console.log(`📡 响应状态: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 请求失败:');
      console.error(`   状态码: ${response.status}`);
      console.error(`   错误信息: ${errorText}\n`);
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ 连接成功！\n');
    console.log('📝 AI 响应:');
    console.log(`   ${data.choices[0].message.content}\n`);
    console.log('🎉 通义千问 API 工作正常！');
    
  } catch (error) {
    console.error('❌ 连接失败:');
    console.error(`   错误: ${error.message}\n`);
    process.exit(1);
  }
}

testQwen();
