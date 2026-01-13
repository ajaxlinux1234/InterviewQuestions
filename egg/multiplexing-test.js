const http2 = require('http2');

console.log('🧪 HTTP/2 Multiplexing Test\n');

const client = http2.connect('https://localhost:8001', {
  rejectUnauthorized: false
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
  client.close();
});

client.on('connect', () => {
  console.log('✅ HTTP/2 connection established');
  console.log('📡 Testing multiplexing - sending 3 concurrent requests...\n');
  
  const startTime = Date.now();
  let completedRequests = 0;
  
  // 发送多个并发请求来测试多路复用
  const requests = [
    { path: '/', name: 'Root' },
    { path: '/user?userId=user1', name: 'User1' },
    { path: '/user?userId=user2', name: 'User2' }
  ];
  
  requests.forEach((reqInfo, index) => {
    const req = client.request({
      ':method': 'GET',
      ':path': reqInfo.path
    });
    
    const reqStartTime = Date.now();
    
    req.on('response', (headers) => {
      console.log(`📡 ${reqInfo.name} - Status: ${headers[':status']}`);
    });
    
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    
    req.on('end', () => {
      const reqEndTime = Date.now();
      const reqDuration = reqEndTime - reqStartTime;
      
      try {
        const response = JSON.parse(data);
        console.log(`✅ ${reqInfo.name} completed in ${reqDuration}ms`);
        console.log(`   Message: ${response.message}`);
        if (response.protocol) {
          console.log(`   Protocol: HTTP/${response.protocol}`);
        }
      } catch (e) {
        console.log(`✅ ${reqInfo.name} completed in ${reqDuration}ms (raw response)`);
      }
      
      completedRequests++;
      
      if (completedRequests === requests.length) {
        const totalTime = Date.now() - startTime;
        console.log(`\n🎉 All requests completed in ${totalTime}ms`);
        console.log('📊 HTTP/2 Multiplexing Benefits:');
        console.log('   - Single TCP connection for all requests');
        console.log('   - Concurrent request processing');
        console.log('   - Reduced latency compared to HTTP/1.1');
        
        client.close();
        console.log('\n🔚 Multiplexing test completed');
      }
    });
    
    req.end();
  });
});

// 超时处理
setTimeout(() => {
  console.log('⏰ Test timeout');
  client.close();
}, 10000);