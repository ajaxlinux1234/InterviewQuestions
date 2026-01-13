const express = require('express');
const mysql = require('mysql2/promise');
const Redis = require('ioredis');

const app = express();
const port = 7001;

// 创建MySQL连接池
const mysqlPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'im_service',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 创建Redis客户端
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  lazyConnect: true
});

app.use(express.json());

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: 'IM Backend Service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 健康检查
app.get('/health', async (req, res) => {
  const status = { mysql: false, redis: false };
  
  // 测试MySQL
  try {
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();
    status.mysql = true;
  } catch (error) {
    console.error('MySQL health check failed:', error.message);
  }
  
  // 测试Redis
  try {
    await redis.ping();
    status.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error.message);
  }
  
  const allHealthy = status.mysql && status.redis;
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      database: status.mysql ? 'connected' : 'disconnected',
      redis: status.redis ? 'connected' : 'disconnected'
    }
  });
});

// 数据库测试
app.get('/test-db', async (req, res) => {
  try {
    // 测试MySQL查询
    const [users] = await mysqlPool.execute('SELECT COUNT(*) as count FROM users');
    
    // 测试Redis操作
    await redis.set('test_key', 'test_value');
    const redisValue = await redis.get('test_key');
    
    res.json({
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
    });
  } catch (error) {
    res.status(500).json({
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`IM Backend Service is running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Database test: http://localhost:${port}/test-db`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mysqlPool.end();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mysqlPool.end();
  redis.disconnect();
  process.exit(0);
});