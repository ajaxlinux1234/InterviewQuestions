const http2 = require('http2');
const fs = require('fs');
const path = require('path');

// 创建 HTTP/2 服务器
const server = http2.createSecureServer({
  key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
  allowHTTP1: true // 允许 HTTP/1.1 回退
});

server.on('stream', (stream, headers) => {
  const path = headers[':path'];
  const method = headers[':method'];
  
  console.log(`📡 HTTP/2 Request: ${method} ${path}`);
  
  // 路由处理
  if (path === '/' && method === 'GET') {
    stream.respond({
      'content-type': 'application/json',
      ':status': 200
    });
    
    stream.end(JSON.stringify({
      message: 'Welcome to HTTP/2.0 Server! 🚀',
      timestamp: new Date().toISOString(),
      protocol: '2.0',
      features: {
        multiplexing: true,
        headerCompression: true,
        serverPush: true,
        binaryProtocol: true
      }
    }));
    
  } else if (path.startsWith('/user') && method === 'GET') {
    const url = new URL(path, 'https://localhost:7001');
    const userId = url.searchParams.get('userId') || 'guest';
    
    stream.respond({
      'content-type': 'application/json',
      ':status': 200
    });
    
    stream.end(JSON.stringify({
      message: `Hello, ${userId}!`,
      timestamp: new Date().toISOString(),
      protocol: '2.0',
      http2Features: {
        multiplexing: 'Multiple requests over single connection',
        headerCompression: 'HPACK reduces overhead',
        serverPush: 'Proactive resource delivery',
        binaryFraming: 'Efficient binary protocol'
      }
    }));
    
  } else if (path === '/push' && method === 'GET') {
    // 演示服务器推送
    if (stream.pushAllowed) {
      const pushStream = stream.pushStream({
        ':path': '/pushed-resource',
        ':method': 'GET'
      });
      
      pushStream.respond({
        'content-type': 'application/json',
        ':status': 200
      });
      
      pushStream.end(JSON.stringify({
        message: 'This resource was pushed by the server!',
        timestamp: new Date().toISOString(),
        pushed: true
      }));
      
      console.log('📤 Server push executed');
    }
    
    stream.respond({
      'content-type': 'application/json',
      ':status': 200
    });
    
    stream.end(JSON.stringify({
      message: 'Server push demonstration',
      timestamp: new Date().toISOString(),
      pushExecuted: stream.pushAllowed,
      note: 'Check network tab for pushed resource'
    }));
    
  } else {
    stream.respond({
      'content-type': 'application/json',
      ':status': 404
    });
    
    stream.end(JSON.stringify({
      error: 'Not Found',
      path: path,
      timestamp: new Date().toISOString()
    }));
  }
});

server.on('error', (err) => {
  console.error('❌ HTTP/2 Server Error:', err);
});

const PORT = 8001;
server.listen(PORT, () => {
  console.log('🚀 HTTP/2 Server started!');
  console.log(`🌐 Server running on https://localhost:${PORT}`);
  console.log('📡 HTTP/2 features enabled:');
  console.log('   - Binary framing');
  console.log('   - Multiplexing');
  console.log('   - Header compression (HPACK)');
  console.log('   - Server push');
  console.log('');
  console.log('🧪 Test endpoints:');
  console.log(`   curl -k https://localhost:${PORT}/`);
  console.log(`   curl -k https://localhost:${PORT}/user?userId=test`);
  console.log(`   curl -k https://localhost:${PORT}/push`);
});