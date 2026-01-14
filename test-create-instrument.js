#!/usr/bin/env node

/**
 * 测试仪器创建功能
 */

const https = require('https');
const process = require('process');

// 忽略自签名证书错误
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const API_BASE = 'https://localhost:7002';

// 测试用户凭据
const TEST_USER = {
  username: 'testuser123',
  password: '482c811da5d5b4bc6d497ffa98491e38'
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
 * 登录获取 token
 */
async function login() {
  console.log('🔐 登录获取 token...');
  
  const response = await makeRequest('POST', '/auth/login', TEST_USER);
  
  if ((response.status === 200 || response.status === 201) && response.data.success) {
    authToken = response.data.data.token;
    console.log('✅ 登录成功');
    return true;
  } else {
    console.log('❌ 登录失败:', response.data);
    return false;
  }
}

/**
 * 测试创建仪器
 */
async function testCreateInstrument() {
  console.log('\n📝 测试创建仪器...');
  
  // 测试数据 - 确保所有数字字段都是数字类型
  const instrumentData = {
    name: "测试仪器",
    model: "TEST-001",
    serialNumber: "TEST" + Date.now(),
    categoryId: 6,  // 数字类型
    brandId: 2,     // 数字类型
    description: "这是一个测试仪器",
    location: "测试实验室",
    department: "测试部门",
    responsiblePerson: "测试人员",
    contactInfo: "test@example.com",
    purchaseDate: "2026-01-14",
    purchasePrice: 50000,  // 数字类型
    supplier: "测试供应商",
    warrantyPeriod: 12,    // 数字类型
    status: "available",
    conditionLevel: "excellent"
  };
  
  console.log('发送数据:', JSON.stringify(instrumentData, null, 2));
  
  try {
    const response = await makeRequest('POST', '/instruments', instrumentData, {
      'Authorization': `Bearer ${authToken}`
    });
    
    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 201) {
      console.log('✅ 仪器创建成功');
      console.log(`   仪器ID: ${response.data.id}`);
      console.log(`   仪器名称: ${response.data.name}`);
      console.log(`   序列号: ${response.data.serialNumber}`);
      return response.data;
    } else {
      console.log('❌ 仪器创建失败');
      if (response.data.message) {
        if (Array.isArray(response.data.message)) {
          response.data.message.forEach(msg => console.log(`   - ${msg}`));
        } else {
          console.log(`   错误: ${response.data.message}`);
        }
      }
      return null;
    }
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    return null;
  }
}

/**
 * 测试查询创建的仪器
 */
async function testGetInstrument(instrumentId) {
  console.log(`\n🔍 测试查询仪器 ID: ${instrumentId}...`);
  
  try {
    const response = await makeRequest('GET', `/instruments/${instrumentId}`, null, {
      'Authorization': `Bearer ${authToken}`
    });
    
    if (response.status === 200) {
      console.log('✅ 仪器查询成功');
      console.log(`   名称: ${response.data.name}`);
      console.log(`   型号: ${response.data.model}`);
      console.log(`   分类: ${response.data.category?.name}`);
      console.log(`   品牌: ${response.data.brand?.name}`);
      return true;
    } else {
      console.log('❌ 仪器查询失败:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ 查询请求失败:', error.message);
    return false;
  }
}

/**
 * 主测试函数
 */
async function runTest() {
  console.log('🚀 开始测试仪器创建功能...\n');
  
  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('登录失败，停止测试');
    return;
  }
  
  // 2. 创建仪器
  const createdInstrument = await testCreateInstrument();
  if (!createdInstrument) {
    console.log('仪器创建失败，停止测试');
    return;
  }
  
  // 3. 查询创建的仪器
  const querySuccess = await testGetInstrument(createdInstrument.id);
  
  console.log('\n' + '='.repeat(50));
  if (querySuccess) {
    console.log('🎉 所有测试通过！仪器创建功能正常工作。');
  } else {
    console.log('⚠️  部分测试失败。');
  }
}

// 运行测试
runTest().catch(console.error);