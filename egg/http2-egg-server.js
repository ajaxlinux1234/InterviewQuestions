const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql2/promise');

// HTTP/2 服务器 - 集成 Egg.js 功能
class HTTP2EggIntegratedServer {
  constructor() {
    this.server = null;
    this.mysqlPool = null;
  }

  async start() {
    console.log('🚀 正在启动集成 HTTP/2.0 服务器 (包含 Egg.js 功能)...');
    
    // 初始化 MySQL 连接池
    this.initDatabase();
    
    // 读取 SSL 证书
    const options = {
      key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
      allowHTTP1: true, // 允许 HTTP/1.1 回退
    };

    // 创建 HTTP/2 安全服务器
    this.server = http2.createSecureServer(options);
    
    // 处理流请求
    this.server.on('stream', (stream, headers) => {
      this.handleStream(stream, headers);
    });

    // 启动服务器
    const port = 7001;
    this.server.listen(port, '127.0.0.1', () => {
      console.log('✅ HTTP/2.0 集成服务器启动成功!');
      console.log(`🌐 服务器运行在: https://localhost:${port}`);
      console.log('📡 HTTP/2.0 功能已启用:');
      console.log('   - 多路复用 (Multiplexing)');
      console.log('   - 头部压缩 (Header Compression)');
      console.log('   - 服务器推送 (Server Push)');
      console.log('   - 二进制协议 (Binary Protocol)');
      console.log('');
      console.log('🔗 测试端点:');
      console.log('   - GET https://localhost:7001/ (首页)');
      console.log('   - GET https://localhost:7001/user?userId=test (用户信息)');
      console.log('   - GET https://localhost:7001/push (服务器推送演示)');
    });

    // 错误处理
    this.server.on('error', (err) => {
      console.error('❌ HTTP/2 服务器错误:', err);
    });

    // 处理进程退出
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  initDatabase() {
    try {
      this.mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'im_service',
        connectionLimit: 5,
        acquireTimeout: 30000,
        timeout: 30000,
      });
      console.log('✅ MySQL 连接池初始化完成');
    } catch (error) {
      console.log('⚠️  MySQL 连接池初始化失败:', error.message);
    }
  }

  async handleStream(stream, headers) {
    const method = headers[':method'];
    const path = headers[':path'];
    const parsedUrl = url.parse(path, true);
    
    console.log(`📡 HTTP/2 请求: ${method} ${path}`);

    try {
      let response;
      
      // 路由处理
      switch (parsedUrl.pathname) {
        case '/':
          response = await this.handleHome();
          break;
        case '/user':
          response = await this.handleUser(parsedUrl.query);
          break;
        case '/push':
          response = await this.handlePush(stream);
          break;
        default:
          response = this.handle404();
      }

      // 发送响应
      stream.respond({
        'content-type': 'application/json; charset=utf-8',
        ':status': response.status || 200
      });
      
      stream.end(JSON.stringify(response.body, null, 2));
      
    } catch (error) {
      console.error('❌ 请求处理错误:', error);
      stream.respond({
        'content-type': 'application/json; charset=utf-8',
        ':status': 500
      });
      stream.end(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }));
    }
  }

  async handleHome() {
    return {
      status: 200,
      body: {
        message: '111Welcome to HTTP/2.0 Egg.js Server! 🚀',
        timestamp: new Date().toISOString(),
        status: 'success',
        server: {
          framework: 'HTTP/2 + Egg.js Integration',
          version: '2.0.0',
          protocol: '2.0',
          scheme: 'https',
          encrypted: true,
          http2Enabled: true
        },
        endpoints: {
          user: '/user?userId=yourname',
          push: '/push (HTTP/2 server push demo)',
          health: 'Direct database test available'
        },
        http2Features: {
          multiplexing: 'Multiple requests over single connection',
          headerCompression: 'HPACK compression reduces overhead',
          serverPush: 'Server can push resources proactively',
          binaryProtocol: 'More efficient than text-based HTTP/1.1'
        }
      }
    };
  }

  async handleUser(query) {
    const userId = query.userId || 'guest';
    console.log('**用户请求 - HTTP/2.0 服务**', userId);
    
    return {
      status: 200,
      body: {
        message: `Hello, ${userId}!`,
        timestamp: new Date().toISOString(),
        status: 'success',
        version: '2.0.0 - HTTP/2 Enabled',
        protocol: {
          version: '2.0',
          scheme: 'https',
          encrypted: true,
          http2: true
        },
        features: {
          multiplexing: true,
          headerCompression: true,
          serverPush: true
        }
      }
    };
  }

  async handlePush(stream) {
    // 演示服务器推送功能
    if (stream.pushAllowed) {
      try {
        const pushStream = stream.pushStream({
          ':path': '/api/pushed-resource',
          ':method': 'GET'
        }, (err, pushStream) => {
          if (err) {
            console.log('⚠️  Server push failed:', err.message);
            return;
          }
          
          pushStream.respond({
            'content-type': 'application/json',
            ':status': 200
          });
          
          pushStream.end(JSON.stringify({
            message: 'This is a pushed resource!',
            timestamp: new Date().toISOString(),
            pushed: true
          }));
          
          console.log('📡 Server push executed');
        });
        
      } catch (error) {
        console.log('⚠️  Server push failed:', error.message);
      }
    }
    
    return {
      status: 200,
      body: {
        message: 'Server push demonstration',
        timestamp: new Date().toISOString(),
        http2: true,
        pushSupported: stream.pushAllowed,
        pushExecuted: stream.pushAllowed
      }
    };
  }

  handle404() {
    return {
      status: 404,
      body: {
        error: 'Not Found',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
      }
    };
  }

  async stop() {
    console.log('🛑 正在关闭 HTTP/2 服务器...');
    
    if (this.mysqlPool) {
      await this.mysqlPool.end();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ 服务器已关闭');
    process.exit(0);
  }
}

// 启动服务器
if (require.main === module) {
  const server = new HTTP2EggIntegratedServer();
  server.start().catch(console.error);
}

module.exports = HTTP2EggIntegratedServer;