const fs = require('fs');
const path = require('path');
const http2 = require('http2');

module.exports = app => {
  app.beforeStart(async () => {
    console.log('🚀 Application is starting with HTTP/2 support...');
    
    // 验证证书文件存在
    const keyPath = path.join(__dirname, 'certs/key.pem');
    const certPath = path.join(__dirname, 'certs/cert.pem');
    
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('✅ SSL certificates found');
    } else {
      console.log('⚠️  SSL certificates not found, HTTP/2 may not work properly');
    }
  });

  app.ready(() => {
    console.log('✅ Application ready with HTTP/2 support');
    console.log('🌐 Server running on https://localhost:7001');
    console.log('📡 HTTP/2 features enabled:');
    console.log('   - Multiplexing');
    console.log('   - Header compression');
    console.log('   - Server push (if implemented)');
  });
};