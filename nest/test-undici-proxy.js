/**
 * 测试 undici ProxyAgent
 */

const { ProxyAgent, fetch: undiciFetch } = require('undici');

console.log('🔍 测试 undici ProxyAgent...\n');

const PROXY_URL = 'http://127.0.0.1:7890';
const GROQ_API_KEY = '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';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function testWithProxy() {
  try {
    console.log(`📋 使用代理: ${PROXY_URL}\n`);
    
    const proxyAgent = new ProxyAgent(PROXY_URL);
    
    console.log('🚀 发送测试请求到 Groq API...');
    
    const response = await undiciFetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello!" if you can hear me.',
          },
        ],
        max_tokens: 20,
      }),
      dispatcher: proxyAgent,
    });

    console.log(`📡 响应状态: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 请求失败:');
      console.error(`   状态码: ${response.status}`);
      console.error(`   错误信息: ${errorText}\n`);
      
      if (response.status === 403) {
        console.log('💡 API Key 可能已失效');
        console.log('   请访问 https://console.groq.com 重新生成\n');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ 连接成功！\n');
    console.log('📝 AI 响应:');
    console.log(`   ${data.choices[0].message.content}\n`);
    console.log('🎉 undici ProxyAgent 工作正常！');
    
  } catch (error) {
    console.error('❌ 连接失败:');
    console.error(`   错误: ${error.message}`);
    console.error(`   详情: ${error.stack}\n`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 代理连接被拒绝，请检查:');
      console.log('   1. ClashX 是否正在运行');
      console.log('   2. 代理端口是否为 7890');
    }
    
    process.exit(1);
  }
}

testWithProxy();
