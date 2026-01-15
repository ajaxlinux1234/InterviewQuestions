/**
 * 测试内容过滤功能
 */

const { ContentFilterService } = require('./dist/modules/ai/content-filter.service');

// 创建服务实例
const filterService = new ContentFilterService();

console.log('=== 内容过滤测试 ===\n');

// 测试用例
const testCases = [
  {
    name: '正常内容',
    content: '你好，请帮我写一段代码',
    expectedAllowed: true,
  },
  {
    name: '包含暴力关键词',
    content: '如何杀人不被发现',
    expectedAllowed: false,
  },
  {
    name: '包含色情关键词',
    content: '色情网站推荐',
    expectedAllowed: false,
  },
  {
    name: '包含敏感关键词（应该允许但警告）',
    content: '讨论一下政治话题',
    expectedAllowed: true,
  },
  {
    name: 'XSS 攻击',
    content: '<script>alert("xss")</script>',
    expectedAllowed: false,
  },
  {
    name: '重复字符攻击',
    content: 'a'.repeat(100),
    expectedAllowed: false,
  },
  {
    name: '长文本（正常）',
    content: '这是一段很长的正常文本。'.repeat(10),
    expectedAllowed: true,
  },
];

// 运行测试
let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}: ${testCase.name}`);
  console.log(`内容: ${testCase.content.substring(0, 50)}${testCase.content.length > 50 ? '...' : ''}`);
  
  try {
    const result = filterService.checkContent(testCase.content);
    console.log(`结果: ${result.isAllowed ? '✓ 允许' : '✗ 拒绝'}`);
    
    if (result.reason) {
      console.log(`原因: ${result.reason}`);
    }
    
    if (result.matchedKeywords && result.matchedKeywords.length > 0) {
      console.log(`匹配关键词: ${result.matchedKeywords.join(', ')}`);
    }
    
    if (result.severity) {
      console.log(`严重程度: ${result.severity}`);
    }
    
    // 验证结果
    if (result.isAllowed === testCase.expectedAllowed) {
      console.log('✓ 测试通过\n');
      passed++;
    } else {
      console.log(`✗ 测试失败: 期望 ${testCase.expectedAllowed ? '允许' : '拒绝'}, 实际 ${result.isAllowed ? '允许' : '拒绝'}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`✗ 测试失败: ${error.message}\n`);
    failed++;
  }
});

// 测试清理功能
console.log('=== 测试内容清理 ===\n');

const sanitizeTests = [
  {
    name: 'HTML 标签',
    content: '<div>Hello <b>World</b></div>',
    expected: 'Hello World',
  },
  {
    name: 'JavaScript 协议',
    content: 'javascript:alert("xss")',
    expected: 'alert("xss")',
  },
  {
    name: '事件处理器',
    content: '<img src="x" onerror="alert(1)">',
    expected: '',
  },
  {
    name: '重复字符',
    content: 'aaaaaaaaaaaaaaaaaaaaaa',
    expected: 'aaa',
  },
];

sanitizeTests.forEach((test, index) => {
  console.log(`清理测试 ${index + 1}: ${test.name}`);
  console.log(`原始: ${test.content}`);
  
  const sanitized = filterService.sanitizeContent(test.content);
  console.log(`清理后: ${sanitized}`);
  
  if (sanitized === test.expected) {
    console.log('✓ 清理正确\n');
    passed++;
  } else {
    console.log(`✗ 清理失败: 期望 "${test.expected}", 实际 "${sanitized}"\n`);
    failed++;
  }
});

// 测试统计
console.log('=== 过滤器统计 ===\n');
const stats = filterService.getFilterStatistics();
console.log(`被禁止关键词数量: ${stats.blockedKeywordsCount}`);
console.log(`敏感关键词数量: ${stats.sensitiveKeywordsCount}`);
console.log(`恶意模式数量: ${stats.maliciousPatternsCount}`);

// 总结
console.log('\n=== 测试总结 ===');
console.log(`通过: ${passed}`);
console.log(`失败: ${failed}`);
console.log(`总计: ${passed + failed}`);

if (failed === 0) {
  console.log('\n✓ 所有测试通过！');
  process.exit(0);
} else {
  console.log(`\n✗ ${failed} 个测试失败`);
  process.exit(1);
}
