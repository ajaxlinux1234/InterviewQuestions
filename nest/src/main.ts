/**
 * NestJS 应用程序入口文件 (main.ts)
 * 
 * 这是 NestJS 应用的启动文件，负责：
 * 1. 创建 NestJS 应用实例
 * 2. 配置 HTTP/2.0 支持
 * 3. 设置 HTTPS/SSL 证书
 * 4. 启动服务器并监听端口
 * 
 * NestJS 核心概念：
 * - NestFactory: 用于创建 NestJS 应用实例的工厂类
 * - FastifyAdapter: 使用 Fastify 作为底层 HTTP 服务器（比 Express 更快，支持 HTTP/2）
 * - bootstrap(): 应用启动函数，是整个应用的入口点
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 应用启动函数
 * 
 * NestJS 启动流程：
 * 1. 配置 SSL 证书（支持 HTTPS 和 HTTP/2）
 * 2. 创建 Fastify 适配器实例
 * 3. 使用 NestFactory 创建应用
 * 4. 注册中间件（如 CORS）
 * 5. 启动服务器监听指定端口
 */
async function bootstrap() {
  console.log('🚀 正在启动支持 HTTP/2.0 的 NestJS 应用...');
  
  // SSL 证书配置 - 用于 HTTPS 和 HTTP/2 支持
  const keyPath = path.join(__dirname, '../certs/key.pem');
  const certPath = path.join(__dirname, '../certs/cert.pem');
  
  let httpsOptions = null;
  
  // 检查 SSL 证书文件是否存在
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('✅ SSL 证书文件已找到');
    httpsOptions = {
      key: fs.readFileSync(keyPath),    // 私钥文件
      cert: fs.readFileSync(certPath),  // 证书文件
      allowHTTP1: true,                 // 允许 HTTP/1.1 回退兼容
    };
  } else {
    console.log('⚠️  SSL 证书文件未找到，将使用 HTTP 模式');
  }

  // Fastify 配置选项
  // Fastify 是一个高性能的 Node.js Web 框架，比 Express 更快
  const fastifyOptions: any = {
    https: httpsOptions,  // HTTPS 配置
  };
  
  // 如果有 SSL 证书，启用 HTTP/2
  if (httpsOptions) {
    fastifyOptions.http2 = true;
  }
  
  // 创建 Fastify 适配器实例
  // NestJS 默认使用 Express，这里我们使用 Fastify 以获得更好的性能和 HTTP/2 支持
  const fastifyAdapter = new FastifyAdapter(fastifyOptions);

  // 创建 NestJS 应用实例
  // NestFastifyApplication: 指定使用 Fastify 适配器的应用类型
  // AppModule: 应用的根模块，包含所有其他模块的配置
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // 注册 CORS 中间件
  // CORS (Cross-Origin Resource Sharing): 允许跨域请求
  // 这里配置允许所有来源的请求，生产环境应该限制具体域名
  await app.register(require('@fastify/cors'), {
    origin: '*',                                                    // 允许所有来源
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'],    // 允许的 HTTP 方法
  });

  // 注册 multipart 插件（用于文件上传）
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 50 * 1024 * 1024, // 最大文件大小 50MB
    },
  });

  // 注册静态文件服务（用于访问上传的图片和视频）
  await app.register(require('@fastify/static'), {
    root: path.join(__dirname, '../uploads'),  // 静态文件根目录
    prefix: '/uploads/',                        // URL 前缀
  });

  // 启动服务器
  const port = 7002;
  await app.listen(port, '127.0.0.1');  // 监听本地 7002 端口
  
  // 输出启动信息
  const protocol = httpsOptions ? 'https' : 'http';
  console.log('✅ NestJS 应用已就绪，HTTP/2.0 支持已启用');
  console.log(`🌐 服务器运行在: ${protocol}://localhost:${port}`);
  
  if (httpsOptions) {
    console.log('📡 HTTP/2.0 功能已启用:');
    console.log('   - 多路复用 (Multiplexing)');      // 单个连接处理多个请求
    console.log('   - 头部压缩 (Header Compression)'); // HPACK 压缩减少开销
    console.log('   - 服务器推送 (Server Push)');      // 服务器主动推送资源
    console.log('   - 二进制协议 (Binary Protocol)');  // 比文本协议更高效
  }
  
  console.log('');
  console.log('🔗 测试端点:');
  console.log(`   - GET ${protocol}://localhost:${port}/ (首页)`);
  console.log(`   - GET ${protocol}://localhost:${port}/user?userId=test (用户信息)`);
  console.log(`   - GET ${protocol}://localhost:${port}/push (服务器推送演示)`);
  console.log('');
  console.log('🔐 认证端点:');
  console.log(`   - POST ${protocol}://localhost:${port}/auth/register (用户注册)`);
  console.log(`   - POST ${protocol}://localhost:${port}/auth/login (用户登录)`);
  console.log(`   - POST ${protocol}://localhost:${port}/auth/logout (退出登录)`);
  console.log(`   - GET ${protocol}://localhost:${port}/auth/profile (获取用户信息)`);
}

// 启动应用
// 这是整个应用的入口点，Node.js 执行时会调用这个函数
bootstrap();