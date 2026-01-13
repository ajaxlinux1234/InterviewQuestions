const { Controller } = require('egg');

class UserController extends Controller {
  async index() {
    const { ctx } = this;
    const userId = ctx.query.userId || 'guest';
    
    console.log('**用户请求 - HTTP/2.0 服务**', userId);
    
    // 获取 HTTP 版本信息 (支持自定义 HTTP/2 检测)
    const httpVersion = ctx.req.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || ctx.isHTTP2 || false;
    const protocol = ctx.protocol;
    
    ctx.body = {
      message: `Hello, ${userId}!`,
      timestamp: new Date().toISOString(),
      status: 'success',
      version: '2.0.0 - HTTP/2 Enabled',
      protocol: {
        version: httpVersion,
        scheme: protocol,
        encrypted: ctx.secure || protocol === 'https',
        http2: isHTTP2
      },
      features: {
        multiplexing: isHTTP2,
        headerCompression: isHTTP2,
        serverPush: isHTTP2
      }
    };
  }

  // 演示服务器推送功能（HTTP/2 特性）
  async push() {
    const { ctx } = this;
    
    // 检查是否支持 HTTP/2
    if (ctx.req.httpVersion === '2.0' && ctx.res.stream && ctx.res.stream.pushAllowed) {
      try {
        // 推送一个资源
        const pushStream = ctx.res.stream.pushStream({
          ':path': '/api/pushed-resource',
          ':method': 'GET'
        });
        
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
      } catch (error) {
        console.log('⚠️  Server push failed:', error.message);
      }
    }
    
    ctx.body = {
      message: 'Server push demonstration',
      timestamp: new Date().toISOString(),
      http2: ctx.req.httpVersion === '2.0',
      pushSupported: ctx.req.httpVersion === '2.0' && ctx.res.stream && ctx.res.stream.pushAllowed
    };
  }
}

module.exports = UserController;