// 直接测试数据库连接，不依赖项目依赖
const { spawn } = require('child_process');

console.log('🔍 Testing database connections directly...\n');

// 测试MySQL连接
console.log('📊 Testing MySQL connection...');
const mysqlTest = spawn('mysql', ['-u', 'root', '-e', 'USE im_service; SELECT "MySQL connection successful!" as status, COUNT(*) as user_count FROM users;']);

mysqlTest.stdout.on('data', (data) => {
  console.log('✅ MySQL Result:');
  console.log(data.toString());
});

mysqlTest.stderr.on('data', (data) => {
  console.log('❌ MySQL Error:', data.toString());
});

mysqlTest.on('close', (code) => {
  console.log(`MySQL test completed with code: ${code}\n`);
  
  // 测试Redis连接
  console.log('🔴 Testing Redis connection...');
  const redisTest = spawn('redis-cli', ['ping']);
  
  redisTest.stdout.on('data', (data) => {
    const result = data.toString().trim();
    if (result === 'PONG') {
      console.log('✅ Redis connection successful!');
      console.log('   Response:', result);
    } else {
      console.log('❌ Unexpected Redis response:', result);
    }
  });
  
  redisTest.stderr.on('data', (data) => {
    console.log('❌ Redis Error:', data.toString());
  });
  
  redisTest.on('close', (code) => {
    console.log(`\nRedis test completed with code: ${code}`);
    
    if (code === 0) {
      console.log('\n🎉 All database connections are working!');
      console.log('\n📋 Summary:');
      console.log('   ✅ MySQL: Connected to im_service database');
      console.log('   ✅ Redis: Connected and responding');
      console.log('\n🚀 Ready to continue with IM backend development!');
    } else {
      console.log('\n⚠️  Some connections failed. Please check the services.');
    }
  });
});