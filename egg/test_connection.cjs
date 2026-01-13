const mysql = require('mysql2/promise');
const Redis = require('ioredis');

async function testConnections() {
  console.log('Testing database connections...');
  
  // 测试MySQL连接
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'im_service'
    });
    
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ MySQL connection successful!');
    console.log('   Users table exists, count:', rows[0].count);
    await connection.end();
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
  }
  
  // 测试Redis连接
  try {
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      lazyConnect: true
    });
    
    await redis.connect();
    const result = await redis.ping();
    console.log('✅ Redis connection successful!');
    console.log('   Ping result:', result);
    redis.disconnect();
  } catch (error) {
    console.log('❌ Redis connection failed:', error.message);
  }
}

testConnections().then(() => {
  console.log('Connection tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});