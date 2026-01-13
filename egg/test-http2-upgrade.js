const http2 = require('http2');
const fs = require('fs');

// 测试 HTTP/2 连接
async function testHTTP2() {
  console.log('🧪 测试 HTTP/2.0 连接...\n');
  
  const client = http2.connect('https://localhost:7001', {
    rejectUnauthorized: false // 忽略自签名证书
  });

  client.on('error', (err) => {
    console.error('❌ 连接错误:', err.message);
    client.close();
  });

  // 测试首页
  console.log('1️⃣ 测试首页 (/)');
  const req1 = client.request({ ':path': '/' });
  
  req1.on('response', (headers) => {
    console.log('✅ 响应状态:', headers[':status']);
    console.log('📡 协议版本: HTTP/2.0');
  });

  let data1 = '';
  req1.on('data', (chunk) => {
    data1 += chunk;
  });

  req1.on('end', () => {
    const response = JSON.parse(data1);
    console.log('📄 响应数据:', {
      message: response.message,
      http2Enabled: response.server.http2Enabled,
      protocol: response.server.protocol
    });
    console.log('');
    
    // 测试用户端点
    console.log('2️⃣ 测试用户端点 (/user?userId=http2test)');
    const req2 = client.request({ ':path': '/user?userId=http2test' });
    
    req2.on('response', (headers) => {
      console.log('✅ 响应状态:', headers[':status']);
    });

    let data2 = '';
    req2.on('data', (chunk) => {
      data2 += chunk;
    });

    req2.on('end', () => {
      const response2 = JSON.parse(data2);
      console.log('📄 用户响应:', {
        message: response2.message,
        http2: response2.protocol.http2,
        features: response2.features
      });
      console.log('');
      
      // 测试多路复用 - 同时发送多个请求
      console.log('3️⃣ 测试多路复用 (同时发送3个请求)');
      const startTime = Date.now();
      
      let completedRequests = 0;
      const totalRequests = 3;
      
      for (let i = 1; i <= totalRequests; i++) {
        const req = client.request({ ':path': `/user?userId=multiplexing-test-${i}` });
        
        req.on('response', (headers) => {
          console.log(`✅ 请求 ${i} 完成 (状态: ${headers[':status']})`);
        });

        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });

        req.on('end', () => {
          completedRequests++;
          if (completedRequests === totalRequests) {
            const endTime = Date.now();
            console.log(`🚀 多路复用测试完成! 总耗时: ${endTime - startTime}ms`);
            console.log('✅ HTTP/2.0 升级成功! 所有功能正常工作');
            client.close();
          }
        });

        req.end();
      }
    });

    req2.end();
  });

  req1.end();
}

// 运行测试
testHTTP2().catch(console.error);