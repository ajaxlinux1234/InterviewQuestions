const http2 = require('http2');

// 测试服务器推送功能
async function testServerPush() {
  console.log('🧪 测试 HTTP/2.0 服务器推送功能...\n');
  
  const client = http2.connect('https://localhost:7001', {
    rejectUnauthorized: false // 忽略自签名证书
  });

  client.on('error', (err) => {
    console.error('❌ 连接错误:', err.message);
    client.close();
  });

  // 监听推送流
  client.on('stream', (pushedStream, requestHeaders) => {
    console.log('📡 收到服务器推送流!');
    console.log('🔗 推送路径:', requestHeaders[':path']);
    
    let pushedData = '';
    pushedStream.on('data', (chunk) => {
      pushedData += chunk;
    });
    
    pushedStream.on('end', () => {
      console.log('📄 推送数据:', JSON.parse(pushedData));
    });
  });

  // 请求 /push 端点
  console.log('1️⃣ 请求服务器推送端点 (/push)');
  const req = client.request({ ':path': '/push' });
  
  req.on('response', (headers) => {
    console.log('✅ 响应状态:', headers[':status']);
  });

  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    const response = JSON.parse(data);
    console.log('📄 主响应:', {
      message: response.message,
      pushSupported: response.pushSupported,
      pushExecuted: response.pushExecuted
    });
    
    // 等待一下让推送完成
    setTimeout(() => {
      console.log('\n✅ 服务器推送测试完成!');
      client.close();
    }, 100);
  });

  req.end();
}

// 运行测试
testServerPush().catch(console.error);