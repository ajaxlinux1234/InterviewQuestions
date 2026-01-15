/**
 * 验证数据库迁移结果
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function verifyMigration() {
  console.log('🔍 验证数据库迁移结果...\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'im_service',
  });

  try {
    // 验证 messages 表结构
    console.log('📋 验证 messages 表结构:');
    const [messagesColumns] = await connection.execute(`
      DESCRIBE messages
    `);
    
    const hasAiPromptId = messagesColumns.some(col => col.Field === 'ai_prompt_id');
    const hasMetadata = messagesColumns.some(col => col.Field === 'metadata');
    const senderIdNullable = messagesColumns.find(col => col.Field === 'sender_id')?.Null === 'YES';
    
    console.log(`   ✅ ai_prompt_id 字段: ${hasAiPromptId ? '存在' : '缺失'}`);
    console.log(`   ✅ metadata 字段: ${hasMetadata ? '存在' : '缺失'}`);
    console.log(`   ✅ sender_id 可空: ${senderIdNullable ? '是' : '否'}`);

    // 验证 type 枚举值
    const typeColumn = messagesColumns.find(col => col.Field === 'type');
    const hasAiTypes = typeColumn?.Type.includes('ai_prompt') && typeColumn?.Type.includes('ai_response');
    console.log(`   ✅ AI 消息类型: ${hasAiTypes ? '已添加' : '缺失'}`);

    // 验证 ai_request_logs 表
    console.log('\n📋 验证 ai_request_logs 表:');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'ai_request_logs'
    `);
    
    if (tables.length > 0) {
      console.log('   ✅ ai_request_logs 表存在');
      
      const [logColumns] = await connection.execute(`
        DESCRIBE ai_request_logs
      `);
      
      console.log(`   ✅ 字段数量: ${logColumns.length}`);
      console.log('   ✅ 主要字段:');
      logColumns.forEach(col => {
        console.log(`      - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(可空)' : '(必需)'}`);
      });
    } else {
      console.log('   ❌ ai_request_logs 表不存在');
    }

    // 验证索引
    console.log('\n📋 验证索引:');
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM messages WHERE Key_name LIKE '%ai%' OR Key_name LIKE '%type%'
    `);
    
    console.log(`   ✅ messages 表 AI 相关索引: ${indexes.length} 个`);
    indexes.forEach(idx => {
      console.log(`      - ${idx.Key_name} (${idx.Column_name})`);
    });

    const [logIndexes] = await connection.execute(`
      SHOW INDEX FROM ai_request_logs
    `);
    
    console.log(`   ✅ ai_request_logs 表索引: ${logIndexes.length} 个`);
    logIndexes.forEach(idx => {
      console.log(`      - ${idx.Key_name} (${idx.Column_name})`);
    });

    console.log('\n🎉 数据库迁移验证完成！');

  } catch (error) {
    console.error('\n❌ 验证失败:', error.message);
  } finally {
    await connection.end();
  }
}

verifyMigration();