const http2 = require('http2');
const fs = require('fs');

// HTTP/2 客户端测试
function testHTTP2() {
  console.log('🧪 Testing HTTP/2 connection...\n');
  
  const client = http2.connect('https://localhost:8001', {
    // 忽略自签名证书错误（仅用于测试）
    rejectUnauthorized: false
  });

  client.on('error', (err) => {
    console.error('❌ HTTP/2 Client Error:', err.message);
    client.close();
  });

  client.on('connect', () => {
    console.log('✅ HTTP/2 connection established');
  });

  // 测试基本请求
  const req1 = client.request({ ':path': '/' });
  req1.on('response', (headers) => {
    console.log('📡 Response headers for /:', headers[':status']);
  });
  
  let data1 = '';
  req1.on('data', (chunk) => {
    data1 += chunk;
  });
  
  req1.on('end', () => {
    console.log('✅ Root endpoint response:');
    try {
      const parsed = JSON.parse(data1);
      console.log(`   Protocol: ${parsed.protocol || 'unknown'}`);
      console.log(`   Multiplexing: ${parsed.features?.multiplexing || false}`);
      console.log(`   Header Compression: ${parsed.features?.headerCompression || false}`);
      console.log(`   Server Push: ${parsed.features?.serverPush || false}`);
      console.log(`   Message: ${parsed.message}\n`);
    } catch (e) {
      console.log('   Raw response:', data1.substring(0, 100) + '...\n');
    }
  });

  // 测试用户端点
  const req2 = client.request({ ':path': '/user?userId=http2-test' });
  req2.on('response', (headers) => {
    console.log('📡 Response headers for /user:', headers[':status']);
  });
  
  let data2 = '';
  req2.on('data', (chunk) => {
    data2 += chunk;
  });
  
  req2.on('end', () => {
    console.log('✅ User endpoint response:');
    try {
      const parsed = JSON.parse(data2);
      console.log(`   Protocol: ${parsed.protocol || 'unknown'}`);
      console.log(`   Features:`, Object.keys(parsed.http2Features || {}));
      console.log(`   Message: ${parsed.message}\n`);
    } catch (e) {
      console.log('   Raw response:', data2.substring(0, 100) + '...\n');
    }
  });

  // 测试服务器推送
  const req3 = client.request({ ':path': '/push' });
  
  req3.on('push', (headers, pushStream) => {
    console.log('📤 Server push received:', headers[':path']);
    
    let pushData = '';
    pushStream.on('data', (chunk) => {
      pushData += chunk;
    });
    
    pushStream.on('end', () => {
      console.log('✅ Pushed resource data:', pushData);
    });
  });
  
  req3.on('response', (headers) => {
    console.log('📡 Response headers for /push:', headers[':status']);
  });
  
  let data3 = '';
  req3.on('data', (chunk) => {
    data3 += chunk;
  });
  
  req3.on('end', () => {
    console.log('✅ Push endpoint response:');
    try {
      const parsed = JSON.parse(data3);
      console.log(`   Push executed: ${parsed.pushExecuted || false}`);
      console.log(`   Message: ${parsed.message}\n`);
    } catch (e) {
      console.log('   Raw response:', data3.substring(0, 100) + '...\n');
    }
    
    // 关闭连接
    setTimeout(() => {
      client.close();
      console.log('🔚 HTTP/2 test completed');
    }, 1000);
  });

  req1.end();
  req2.end();
  req3.end();
}

// 延迟执行测试，确保服务器已启动
setTimeout(testHTTP2, 1000);