const http2 = require('http2');

console.log('🧪 Simple HTTP/2 Test\n');

const client = http2.connect('https://localhost:8001', {
  rejectUnauthorized: false
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err.message);
});

client.on('connect', () => {
  console.log('✅ HTTP/2 connection established');
  
  // 发送单个请求
  const req = client.request({
    ':method': 'GET',
    ':path': '/'
  });
  
  req.on('response', (headers) => {
    console.log('📡 Status:', headers[':status']);
    console.log('📡 Content-Type:', headers['content-type']);
  });
  
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  
  req.on('end', () => {
    console.log('✅ Response received:');
    try {
      const response = JSON.parse(data);
      console.log('   Protocol:', response.protocol);
      console.log('   Features:', response.features);
      console.log('   Message:', response.message);
    } catch (e) {
      console.log('   Raw:', data);
    }
    
    client.close();
    console.log('\n🔚 Test completed successfully');
  });
  
  req.end();
});

// 超时处理
setTimeout(() => {
  console.log('⏰ Test timeout');
  client.close();
}, 5000);