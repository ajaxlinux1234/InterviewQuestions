const fs = require('fs');
const path = require('path');

module.exports = app => {
  app.beforeStart(async () => {
    console.log('🚀 正在启动支持 HTTP/2.0 的 Egg.js 应用...');
    
    // 验证证书文件存在
    const keyPath = path.join(__dirname, 'certs/key.pem');
    const certPath = path.join(__dirname, 'certs/cert.pem');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('✅ SSL 证书文件已找到');
      console.log('🔐 HTTPS 已启用，HTTP/2.0 将自动激活');
    } else {
      console.log('⚠️  SSL 证书文件未找到，HTTP/2.0 可能无法正常工作');
    }
  });

  app.ready(() => {
    console.log('✅ 应用已就绪，HTTP/2.0 支持已启用');
    console.log('🌐 服务器运行在: https://localhost:7001');
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
};