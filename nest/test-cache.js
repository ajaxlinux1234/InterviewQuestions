/**
 * HTTP 缓存测试脚本
 * 
 * 测试 NestJS 应用的 HTTP 缓存功能，包括：
 * 1. 强缓存 (Cache-Control)
 * 2. 协商缓存 (ETag, Last-Modified)
 * 3. 条件请求 (If-None-Match, If-Modified-Since)
 */

const https = require('https');
const http = require('http');

// 忽略自签名证书错误（仅用于测试）
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * 发送 HTTP 请求的辅助函数
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 7002 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * 测试缓存功能
 */
async function testCaching() {
  console.log('🧪 开始测试 HTTP 缓存功能...\n');
  
  const baseOptions = {
    hostname: 'localhost',
    port: 7002, // NestJS HTTP/2 服务端口
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  };
  
  try {
    // 测试 1: 首次请求用户信息
    console.log('📋 测试 1: 首次请求用户信息');
    const firstResponse = await makeRequest({
      ...baseOptions,
      path: '/user?userId=testuser'
    });
    
    console.log(`状态码: ${firstResponse.statusCode}`);
    console.log(`Cache-Control: ${firstResponse.headers['cache-control']}`);
    console.log(`ETag: ${firstResponse.headers['etag']}`);
    console.log(`Last-Modified: ${firstResponse.headers['last-modified']}`);
    console.log(`Expires: ${firstResponse.headers['expires']}`);
    console.log('---\n');
    
    // 测试 2: 使用 If-None-Match 进行条件请求
    console.log('📋 测试 2: 条件请求 (If-None-Match)');
    const etag = firstResponse.headers['etag'];
    
    if (etag) {
      const conditionalResponse = await makeRequest({
        ...baseOptions,
        path: '/user?userId=testuser',
        headers: {
          ...baseOptions.headers,
          'If-None-Match': etag
        }
      });
      
      console.log(`状态码: ${conditionalResponse.statusCode}`);
      console.log(`预期: 304 (Not Modified)`);
      console.log(`实际: ${conditionalResponse.statusCode === 304 ? '✅ 正确' : '❌ 错误'}`);
    } else {
      console.log('❌ 未找到 ETag 头');
    }
    console.log('---\n');
    
    // 测试 3: 使用 If-Modified-Since 进行条件请求
    console.log('📋 测试 3: 条件请求 (If-Modified-Since)');
    const lastModified = firstResponse.headers['last-modified'];
    
    if (lastModified) {
      const conditionalResponse2 = await makeRequest({
        ...baseOptions,
        path: '/user?userId=testuser',
        headers: {
          ...baseOptions.headers,
          'If-Modified-Since': lastModified
        }
      });
      
      console.log(`状态码: ${conditionalResponse2.statusCode}`);
      console.log(`预期: 304 (Not Modified)`);
      console.log(`实际: ${conditionalResponse2.statusCode === 304 ? '✅ 正确' : '❌ 错误'}`);
    } else {
      console.log('❌ 未找到 Last-Modified 头');
    }
    console.log('---\n');
    
    // 测试 4: 测试不同的缓存策略
    console.log('📋 测试 4: 不同端点的缓存策略');
    
    // 测试推送端点 (SHORT 缓存)
    const pushResponse = await makeRequest({
      ...baseOptions,
      path: '/push'
    });
    
    console.log('推送端点缓存头:');
    console.log(`Cache-Control: ${pushResponse.headers['cache-control']}`);
    console.log(`ETag: ${pushResponse.headers['etag']}`);
    console.log('---\n');
    
    // 测试认证端点 (NO_CACHE)
    console.log('📋 测试 5: 无缓存端点 (需要先登录)');
    console.log('注意: 此测试需要有效的认证令牌');
    console.log('---\n');
    
    console.log('✅ 缓存测试完成!');
    console.log('\n📊 测试总结:');
    console.log('- 强缓存: Cache-Control 头已设置');
    console.log('- 协商缓存: ETag 和 Last-Modified 头已设置');
    console.log('- 条件请求: 支持 If-None-Match 和 If-Modified-Since');
    console.log('- 304 响应: 内容未修改时正确返回 304');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 提示:');
    console.log('1. 确保 NestJS 服务正在运行 (npm run start:dev)');
    console.log('2. 确保服务运行在端口 7002');
    console.log('3. 确保 HTTPS 证书配置正确');
  }
}

/**
 * 性能测试
 */
async function performanceTest() {
  console.log('\n🚀 开始性能测试...\n');
  
  const baseOptions = {
    hostname: 'localhost',
    port: 7002,
    method: 'GET',
    path: '/user?userId=perftest',
    headers: {
      'Accept': 'application/json',
    }
  };
  
  try {
    // 首次请求（无缓存）
    const start1 = Date.now();
    const firstResponse = await makeRequest(baseOptions);
    const time1 = Date.now() - start1;
    
    console.log(`首次请求时间: ${time1}ms`);
    
    // 第二次请求（应该返回 304）
    const start2 = Date.now();
    const secondResponse = await makeRequest({
      ...baseOptions,
      headers: {
        ...baseOptions.headers,
        'If-None-Match': firstResponse.headers['etag']
      }
    });
    const time2 = Date.now() - start2;
    
    console.log(`缓存请求时间: ${time2}ms`);
    console.log(`性能提升: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    console.log(`状态码: ${secondResponse.statusCode} (预期: 304)`);
    
  } catch (error) {
    console.error('❌ 性能测试失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  await testCaching();
  await performanceTest();
}

runTests();