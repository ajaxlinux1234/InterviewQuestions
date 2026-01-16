-- ========================================
-- 数据库架构迁移脚本
-- 用于修复生产环境数据库架构问题
-- 创建时间: 2026-01-16
-- ========================================

USE `im_system`;

-- ========================================
-- 1. 修复 users 表
-- ========================================

-- 检查并添加 last_seen 列
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'last_seen';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL COMMENT ''最后在线时间'' AFTER email')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并修改 password_hash 为 password
SET @columnname_old = 'password_hash';
SET @columnname_new = 'password';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname_old)
  ) > 0,
  CONCAT('ALTER TABLE ', @tablename, ' CHANGE COLUMN ', @columnname_old, ' ', @columnname_new, ' VARCHAR(255) NOT NULL'),
  'SELECT 1'
));
PREPARE alterIfExists FROM @preparedStatement;
EXECUTE alterIfExists;
DEALLOCATE PREPARE alterIfExists;

-- ========================================
-- 2. 修复 messages 表
-- ========================================

SET @tablename = 'messages';

-- 修改 type 枚举类型，添加 ai_prompt 和 ai_response
ALTER TABLE messages 
  MODIFY COLUMN type ENUM('text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response') NOT NULL;

-- 检查并添加 ai_prompt_id 列
SET @columnname = 'ai_prompt_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BIGINT NULL AFTER reply_to_message_id, ADD INDEX idx_ai_prompt_id (', @columnname, ')')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并添加 ai_conversation_id 列
SET @columnname = 'ai_conversation_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BIGINT NULL AFTER ai_prompt_id, ADD INDEX idx_ai_conversation_id (', @columnname, ')')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 检查并添加 metadata 列
SET @columnname = 'metadata';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON NULL AFTER ai_conversation_id')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ========================================
-- 完成
-- ========================================
SELECT 'Schema migration completed successfully!' AS message;
SELECT 'Please restart your NestJS application.' AS reminder;
