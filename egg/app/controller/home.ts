import { Controller } from 'egg';

export default class HomeController extends Controller {
  public async index() {
    const { ctx } = this;
    ctx.body = {
      message: 'IM Backend Service is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  public async health() {
    const { ctx, app } = this;
    
    try {
      // 测试MySQL连接
      let mysqlStatus = false;
      try {
        await app.mysql.query('SELECT 1');
        mysqlStatus = true;
      } catch (error) {
        this.logger.error('MySQL health check failed:', error);
      }

      // 测试Redis连接
      let redisStatus = false;
      try {
        await app.redis.ping();
        redisStatus = true;
      } catch (error) {
        this.logger.error('Redis health check failed:', error);
      }
      
      const allHealthy = mysqlStatus && redisStatus;
      
      ctx.status = allHealthy ? 200 : 503;
      ctx.body = {
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          database: mysqlStatus ? 'connected' : 'disconnected',
          redis: redisStatus ? 'connected' : 'disconnected'
        }
      };
    } catch (error) {
      ctx.status = 503;
      ctx.body = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  public async testDb() {
    const { ctx, app } = this;
    
    try {
      // 测试MySQL查询
      const users = await app.mysql.query('SELECT COUNT(*) as count FROM users');
      
      // 测试Redis操作
      await app.redis.set('test_key', 'test_value');
      const redisValue = await app.redis.get('test_key');
      
      ctx.body = {
        message: 'Database test successful',
        results: {
          mysql: {
            userCount: users[0].count
          },
          redis: {
            testValue: redisValue
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: 'Database test failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }
}