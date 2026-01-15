/**
 * 数据库迁移运行脚本
 * 
 * 用于手动运行数据库迁移，添加 AI 功能所需的表结构
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  console.log('🔄 开始运行 AI 支持迁移...\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'im_service',
  });

  try {
    console.log('✅ 数据库连接成功');

    // 1. 修改 messages 表
    console.log('\n📝 修改 messages 表...');
    
    // 允许 sender_id 为 null
    await connection.execute(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`sender_id\` bigint NULL
    `);
    console.log('   ✅ sender_id 字段已修改为可空');

    // 扩展 type 枚举
    await connection.execute(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`type\` enum('text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response') NOT NULL
    `);
    console.log('   ✅ type 枚举已扩展，支持 AI 消息类型');

    // 添加 ai_prompt_id 字段
    await connection.execute(`
      ALTER TABLE \`messages\` 
      ADD COLUMN \`ai_prompt_id\` bigint NULL
    `);
    console.log('   ✅ ai_prompt_id 字段已添加');

    // 添加 metadata 字段
    await connection.execute(`
      ALTER TABLE \`messages\` 
      ADD COLUMN \`metadata\` json NULL
    `);
    console.log('   ✅ metadata 字段已添加');

    // 添加索引
    await connection.execute(`
      CREATE INDEX \`IDX_messages_ai_prompt_id\` ON \`messages\` (\`ai_prompt_id\`)
    `);
    console.log('   ✅ ai_prompt_id 索引已创建');

    await connection.execute(`
      CREATE INDEX \`IDX_messages_type\` ON \`messages\` (\`type\`)
    `);
    console.log('   ✅ type 索引已创建');

    // 2. 创建 ai_request_logs 表
    console.log('\n📝 创建 ai_request_logs 表...');
    
    await connection.execute(`
      CREATE TABLE \`ai_request_logs\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint NOT NULL,
        \`prompt\` text NOT NULL,
        \`response\` text NULL,
        \`model\` varchar(100) NOT NULL,
        \`token_count\` int NULL,
        \`duration\` int NULL COMMENT 'Duration in milliseconds',
        \`status\` enum('success', 'error', 'cancelled', 'timeout') NOT NULL DEFAULT 'success',
        \`error_message\` text NULL,
        \`conversation_id\` bigint NULL,
        \`prompt_message_id\` bigint NULL,
        \`response_message_id\` bigint NULL,
        \`metadata\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);
    console.log('   ✅ ai_request_logs 表已创建');

    // 添加索引
    await connection.execute(`
      CREATE INDEX \`IDX_ai_request_logs_user_id_created_at\` ON \`ai_request_logs\` (\`user_id\`, \`created_at\`)
    `);
    console.log('   ✅ user_id + created_at 复合索引已创建');

    await connection.execute(`
      CREATE INDEX \`IDX_ai_request_logs_status\` ON \`ai_request_logs\` (\`status\`)
    `);
    console.log('   ✅ status 索引已创建');

    await connection.execute(`
      CREATE INDEX \`IDX_ai_request_logs_model\` ON \`ai_request_logs\` (\`model\`)
    `);
    console.log('   ✅ model 索引已创建');

    // 添加外键约束
    await connection.execute(`
      ALTER TABLE \`ai_request_logs\` 
      ADD CONSTRAINT \`FK_ai_request_logs_user_id\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    console.log('   ✅ 外键约束已添加');

    console.log('\n🎉 AI 支持迁移完成！');
    console.log('\n📊 迁移摘要:');
    console.log('   - messages 表已扩展，支持 AI 消息');
    console.log('   - ai_request_logs 表已创建，用于审计日志');
    console.log('   - 相关索引已创建，优化查询性能');
    console.log('   - 外键约束已添加，保证数据完整性');

  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('\n💡 提示: 字段可能已存在，迁移可能已经运行过了');
    } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('\n💡 提示: 表可能已存在，迁移可能已经运行过了');
    } else if (error.code === 'ER_DUP_KEYNAME') {
      console.log('\n💡 提示: 索引可能已存在，迁移可能已经运行过了');
    }
    
    process.exit(1);
  } finally {
    await connection.end();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行迁移
runMigration();