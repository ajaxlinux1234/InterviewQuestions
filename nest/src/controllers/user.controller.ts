import { Controller, Get, Query, Req, Res, Param } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Controller('user')
export class UserController {
  @Get()
  async index(@Query('userId') userId: string = 'guest', @Req() req: FastifyRequest) {
    console.log('**用户请求 - HTTP/2.0 服务 (Query)**', userId);
    
    return this.getUserResponse(userId, req);
  }

  @Get(':userId')
  async getUserById(@Param('userId') userId: string, @Req() req: FastifyRequest) {
    console.log('**用户请求 - HTTP/2.0 服务 (Param)**', userId);
    
    return this.getUserResponse(userId, req);
  }

  private getUserResponse(userId: string, req: FastifyRequest) {
    // 获取 HTTP 版本信息 (支持自定义 HTTP/2 检测)
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0' || (req as any).isHTTP2 || false;
    const protocol = req.protocol;
    const isSecure = req.protocol === 'https';
    
    return {
      message: `Hello, ${userId}!`,
      timestamp: new Date().toISOString(),
      status: 'success',
      version: '2.0.0 - HTTP/2 Enabled',
      protocol: {
        version: httpVersion,
        scheme: protocol,
        encrypted: isSecure,
        http2: isHTTP2
      },
      features: {
        multiplexing: isHTTP2,
        headerCompression: isHTTP2,
        serverPush: isHTTP2
      },
      requestFormat: userId === 'guest' ? 'query-parameter' : 'path-parameter'
    };
  }
}

@Controller('push')
export class PushController {
  @Get()
  async push(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const httpVersion = req.raw.httpVersion || 'unknown';
    const isHTTP2 = httpVersion === '2.0';
    
    // 检查是否支持 HTTP/2 服务器推送
    if (isHTTP2 && (req.raw as any).stream && (req.raw as any).stream.pushAllowed) {
      try {
        // 推送一个资源
        const pushStream = (req.raw as any).stream.pushStream({
          ':path': '/api/pushed-resource',
          ':method': 'GET'
        }, (err: any, pushStream: any) => {
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
    
    const response = {
      message: 'Server push demonstration',
      timestamp: new Date().toISOString(),
      http2: isHTTP2,
      pushSupported: isHTTP2 && (req.raw as any).stream && (req.raw as any).stream.pushAllowed
    };
    
    res.send(response);
  }
}