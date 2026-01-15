import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiSupport1736936400000 implements MigrationInterface {
  name = 'AddAiSupport1736936400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 修改 messages 表以支持 AI 消息
    
    // 允许 sender_id 为 null（AI 消息没有发送者）
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`sender_id\` bigint NULL
    `);

    // 扩展 type 枚举以包含 AI 消息类型
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`type\` enum('text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response') NOT NULL
    `);

    // 添加 ai_prompt_id 字段（关联 AI 响应到提示）
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      ADD COLUMN \`ai_prompt_id\` bigint NULL
    `);

    // 添加 metadata 字段（JSONB 类型存储 AI 相关元数据）
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      ADD COLUMN \`metadata\` json NULL
    `);

    // 添加索引以提高查询性能
    await queryRunner.query(`
      CREATE INDEX \`IDX_messages_ai_prompt_id\` ON \`messages\` (\`ai_prompt_id\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_messages_type\` ON \`messages\` (\`type\`)
    `);

    // 2. 创建 ai_request_logs 表
    await queryRunner.query(`
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

    // 添加索引以提高查询性能
    await queryRunner.query(`
      CREATE INDEX \`IDX_ai_request_logs_user_id_created_at\` ON \`ai_request_logs\` (\`user_id\`, \`created_at\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_ai_request_logs_status\` ON \`ai_request_logs\` (\`status\`)
    `);

    await queryRunner.query(`
      CREATE INDEX \`IDX_ai_request_logs_model\` ON \`ai_request_logs\` (\`model\`)
    `);

    // 添加外键约束
    await queryRunner.query(`
      ALTER TABLE \`ai_request_logs\` 
      ADD CONSTRAINT \`FK_ai_request_logs_user_id\` 
      FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚操作：删除 AI 相关的修改

    // 删除 ai_request_logs 表
    await queryRunner.query(`DROP TABLE \`ai_request_logs\``);

    // 删除 messages 表的索引
    await queryRunner.query(`DROP INDEX \`IDX_messages_ai_prompt_id\` ON \`messages\``);
    await queryRunner.query(`DROP INDEX \`IDX_messages_type\` ON \`messages\``);

    // 删除 messages 表的新字段
    await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`metadata\``);
    await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`ai_prompt_id\``);

    // 恢复 type 枚举的原始值
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`type\` enum('text', 'image', 'video', 'file', 'system') NOT NULL
    `);

    // 恢复 sender_id 为 NOT NULL
    await queryRunner.query(`
      ALTER TABLE \`messages\` 
      MODIFY COLUMN \`sender_id\` bigint NOT NULL
    `);
  }
}