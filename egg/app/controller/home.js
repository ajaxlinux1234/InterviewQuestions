const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    
    // 获取协议信息 (支持自定义 HTTP/2 检测)
    const httpVersion = ctx.req.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || ctx.isHTTP2 || false;
    const protocol = ctx.protocol;
    
    ctx.body = {
      message: 'Welcome to HTTP/2.0 Egg.js Server! 333🚀',
      timestamp: new Date().toISOString(),
      status: 'success',
      server: {
        framework: 'Egg.js',
        version: '3.x',
        protocol: httpVersion,
        scheme: protocol,
        encrypted: ctx.secure || protocol === 'https',
        http2Enabled: isHTTP2
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
    };
  }
}

module.exports = HomeController;