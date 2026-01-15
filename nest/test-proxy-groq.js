/**
 * 测试通过代理连接 Groq API
 */

// 设置代理环境变量
process.env.HTTP_PROXY = 'http://127.0.0.1:7890';
process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
process.env.http_proxy = 'http://127.0.0.1:7890';
process.env.https_proxy = 'http://127.0.0.1:7890';

console.log('🔍 测试通过代理连接 Groq API...\n');

console.log('📋 代理配置:');
console.log(`   HTTP_PROXY: ${process.env.HTTP_PROXY}`);
console.log(`   HTTPS_PROXY: ${process.env.HTTPS_PROXY}\n`);

const GROQ_API_KEY = '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';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

async function testGroqConnection() {
  try {
    console.log('🚀 发送测试请求到 Groq API...');
    
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, proxy test successful!" if you can hear me.',
          },
        ],
        max_tokens: 50,
      }),
    });

    console.log(`📡 响应状态: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API 请求失败:');
      console.error(`   状态码: ${response.status}`);
      console.error(`   错误信息: ${errorText}\n`);
      
      if (response.status === 403) {
        console.log('💡 提示: API Key 可能已失效，请访问 https://console.groq.com 重新生成');
      } else if (response.status === 401) {
        console.log('💡 提示: API Key 无效或未正确配置');
      }
      
      process.exit(1);
    }

    const data = await response.json();
    
    console.log('✅ 连接成功！\n');
    console.log('📝 AI 响应:');
    console.log(`   ${data.choices[0].message.content}\n`);
    console.log('🎉 代理配置正常，Groq API 可以访问！');
    
  } catch (error) {
    console.error('❌ 连接失败:');
    console.error(`   错误: ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 提示: 代理服务器连接被拒绝，请检查:');
      console.log('   1. VPN 是否正在运行');
      console.log('   2. 代理端口是否正确 (当前: 7890)');
      console.log('   3. 代理地址是否正确 (当前: 127.0.0.1)');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('💡 提示: 连接超时，可能是网络问题或代理配置错误');
    } else if (error.message.includes('fetch')) {
      console.log('💡 提示: fetch 请求失败，可能是代理不支持 HTTPS');
    }
    
    process.exit(1);
  }
}

testGroqConnection();
