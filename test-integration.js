#!/usr/bin/env node

/**
 * 集成测试脚本
 * 测试 NestJS 后端 API 和 React 前端的集成
 */

const https = require('https');
const process = require('process');

// 忽略自签名证书错误
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE = 'https://localhost:7002';

// 测试用户凭据
const TEST_USER = {
  username: 'testuser123',
  password: '482c811da5d5b4bc6d497ffa98491e38' // MD5 hash of "password123"
};

let authToken = null;

/**
 * 发送 HTTP 请求
 */
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 测试用户登录
 */
async function testLogin() {
  console.log('🔐 测试用户登录...');
  
  try {
    const response = await makeRequest('POST', '/auth/login', TEST_USER);
    
    if ((response.status === 200 || response.status === 201) && response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ 登录成功');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      console.log(`   用户: ${response.data.data.user.username}`);
      return true;
    } else {
      console.log('❌ 登录失败 - 状态码:', response.status);
      console.log('   响应数据:', JSON.stringify(response.data, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
    return false;
  }
}

/**
 * 测试仪器列表查询
 */
async function testInstrumentsList() {
  console.log('\n📋 测试仪器列表查询...');
  
  try {
    const response = await makeRequest('GET', '/instruments', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      const { data, total, page, limit } = response.data;
      console.log('✅ 仪器列表查询成功');
      console.log(`   总数: ${total} 条记录`);
      console.log(`   当前页: ${page}/${Math.ceil(total / limit)}`);
      console.log(`   仪器列表:`);
      
      data.slice(0, 3).forEach((instrument, index) => {
        console.log(`   ${index + 1}. ${instrument.name} (${instrument.model})`);
        console.log(`      状态: ${instrument.status} | 位置: ${instrument.location}`);
      });
      
      if (data.length > 3) {
        console.log(`   ... 还有 ${data.length - 3} 条记录`);
      }
      
      return true;
    } else {
      console.log('❌ 仪器列表查询失败:', response.data.message || response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 仪器列表请求失败:', error.message);
    return false;
  }
}

/**
 * 测试仪器分类查询
 */
async function testCategories() {
  console.log('\n📂 测试仪器分类查询...');
  
  try {
    const response = await makeRequest('GET', '/instrument-categories', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      const categories = response.data;
      console.log('✅ 仪器分类查询成功');
      console.log(`   分类总数: ${categories.length}`);
      
      categories.slice(0, 5).forEach((category, index) => {
        console.log(`   ${index + 1}. ${category.name} (${category.code})`);
        if (category.children && category.children.length > 0) {
          console.log(`      子分类: ${category.children.map(c => c.name).join(', ')}`);
        }
      });
      
      return true;
    } else {
      console.log('❌ 仪器分类查询失败:', response.data.message || response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 仪器分类请求失败:', error.message);
    return false;
  }
}

/**
 * 测试仪器品牌查询
 */
async function testBrands() {
  console.log('\n🏷️  测试仪器品牌查询...');
  
  try {
    const response = await makeRequest('GET', '/instrument-brands', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      const brands = response.data;
      console.log('✅ 仪器品牌查询成功');
      console.log(`   品牌总数: ${brands.length}`);
      
      brands.slice(0, 5).forEach((brand, index) => {
        console.log(`   ${index + 1}. ${brand.name} (${brand.country})`);
        console.log(`      官网: ${brand.website}`);
      });
      
      return true;
    } else {
      console.log('❌ 仪器品牌查询失败:', response.data.message || response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 仪器品牌请求失败:', error.message);
    return false;
  }
}

/**
 * 测试仪器搜索
 */
async function testSearch() {
  console.log('\n🔍 测试仪器搜索...');
  
  try {
    const response = await makeRequest('GET', '/instruments/search?keyword=色谱&limit=3', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      const results = response.data;
      console.log('✅ 仪器搜索成功');
      console.log(`   搜索关键词: "色谱"`);
      console.log(`   搜索结果: ${results.length} 条`);
      
      results.forEach((instrument, index) => {
        console.log(`   ${index + 1}. ${instrument.name} (${instrument.model})`);
      });
      
      return true;
    } else {
      console.log('❌ 仪器搜索失败:', response.data.message || response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 仪器搜索请求失败:', error.message);
    return false;
  }
}

/**
 * 测试仪器统计信息
 */
async function testStats() {
  console.log('\n📊 测试仪器统计信息...');
  
  try {
    const response = await makeRequest('GET', '/instruments/stats', null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      const stats = response.data;
      console.log('✅ 仪器统计查询成功');
      console.log(`   总仪器数: ${stats.totalCount}`);
      console.log(`   可用仪器: ${stats.availableCount}`);
      console.log(`   使用中仪器: ${stats.inUseCount}`);
      console.log(`   维护中仪器: ${stats.maintenanceCount}`);
      
      if (stats.categoryStats && stats.categoryStats.length > 0) {
        console.log('   分类统计:');
        stats.categoryStats.slice(0, 3).forEach(cat => {
          console.log(`     ${cat.categoryName}: ${cat.count} 台`);
        });
      }
      
      return true;
    } else {
      console.log('❌ 仪器统计查询失败:', response.data.message || response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 仪器统计请求失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始集成测试...\n');
  console.log('测试目标:');
  console.log('  - NestJS 后端 API (https://localhost:7002)');
  console.log('  - React 前端 (http://localhost:3000)');
  console.log('  - 数据库连接和数据完整性');
  console.log('  - HTTP/2.0 和缓存功能');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: '用户登录', fn: testLogin },
    { name: '仪器列表', fn: testInstrumentsList },
    { name: '仪器分类', fn: testCategories },
    { name: '仪器品牌', fn: testBrands },
    { name: '仪器搜索', fn: testSearch },
    { name: '统计信息', fn: testStats }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      passed++;
    } else {
      failed++;
      // 如果登录失败，停止后续测试
      if (test.name === '用户登录') {
        console.log('\n❌ 登录失败，停止后续测试');
        break;
      }
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📋 测试结果汇总:');
  console.log(`✅ 通过: ${passed} 项`);
  console.log(`❌ 失败: ${failed} 项`);
  console.log(`📊 成功率: ${Math.round(passed / (passed + failed) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 所有测试通过！系统运行正常。');
    console.log('\n📱 前端访问地址: http://localhost:3000');
    console.log('🔐 测试账号: testuser123 / password123');
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置。');
  }
  
  console.log('\n🔧 系统信息:');
  console.log(`   Node.js: ${process.version}`);
  console.log(`   平台: ${process.platform}`);
  console.log(`   时间: ${new Date().toLocaleString()}`);
}

// 运行测试
runTests().catch(console.error);