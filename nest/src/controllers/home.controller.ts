import { Controller, Get, Req } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

@Controller()
export class HomeController {
  @Get()
  async index(@Req() req: FastifyRequest) {
    // 获取协议信息 (支持自定义 HTTP/2 检测)
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || (req as any).isHTTP2 || false;
    const protocol = req.protocol;
    const isSecure = req.protocol === 'https';
    
    return {
      message: 'Welcome to HTTP/2.0 NestJS Server! 🚀',
      timestamp: new Date().toISOString(),
      status: 'success',
      server: {
        framework: 'NestJS',
        version: '11.x',
        protocol: httpVersion,
        scheme: protocol,
        encrypted: isSecure,
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