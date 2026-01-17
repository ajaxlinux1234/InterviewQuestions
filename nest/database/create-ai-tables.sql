-- 创建AI相关表的SQL脚本
-- 用于支持AI聊天功能

USE im_system;

-- 1. 创建 ai_conversations 表
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'AI会话ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `title` varchar(255) DEFAULT NULL COMMENT '会话标题',
  `summary` text COMMENT '会话摘要',
  `message_count` int DEFAULT 0 COMMENT '消息数量',
  `status` varchar(50) DEFAULT 'active' COMMENT '会话状态: active, archived, deleted',
  `metadata` json DEFAULT NULL COMMENT '会话元数据',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_ai_conversations_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI会话表';

-- 2. 创建 ai_request_logs 表
CREATE TABLE IF NOT EXISTS `ai_request_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'AI请求日志ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `prompt` text NOT NULL COMMENT '用户提示词',
  `response` text COMMENT 'AI响应内容',
  `model` varchar(100) NOT NULL COMMENT 'AI模型名称',
  `token_count` int DEFAULT NULL COMMENT 'Token数量',
  `duration` int DEFAULT NULL COMMENT '请求持续时间(毫秒)',
  `status` enum('success','error','cancelled','timeout') DEFAULT 'success' COMMENT '请求状态',
  `error_message` text COMMENT '错误信息',
  `conversation_id` bigint DEFAULT NULL COMMENT 'AI会话ID',
  `prompt_message_id` bigint DEFAULT NULL COMMENT '提示消息ID',
  `response_message_id` bigint DEFAULT NULL COMMENT '响应消息ID',
  `metadata` json DEFAULT NULL COMMENT '请求元数据',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id_created_at` (`user_id`, `created_at`),
  KEY `idx_status` (`status`),
  KEY `idx_model` (`model`),
  KEY `idx_conversation_id` (`conversation_id`),
  CONSTRAINT `fk_ai_request_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_request_logs_conversation_id` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI请求日志表';

-- 3. 检查并更新 messages 表，添加AI相关字段
-- 注意：这些字段可能已经存在，如果存在会报错但不影响功能

-- 添加 ai_conversation_id 字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'im_system' 
   AND TABLE_NAME = 'messages' 
   AND COLUMN_NAME = 'ai_conversation_id') = 0,
  'ALTER TABLE `messages` ADD COLUMN `ai_conversation_id` bigint DEFAULT NULL COMMENT ''AI会话ID'' AFTER `conversation_id`',
  'SELECT ''ai_conversation_id column already exists'' as result'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 ai_prompt_id 字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'im_system' 
   AND TABLE_NAME = 'messages' 
   AND COLUMN_NAME = 'ai_prompt_id') = 0,
  'ALTER TABLE `messages` ADD COLUMN `ai_prompt_id` bigint DEFAULT NULL COMMENT ''AI提示消息ID'' AFTER `ai_conversation_id`',
  'SELECT ''ai_prompt_id column already exists'' as result'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加 metadata 字段
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = 'im_system' 
   AND TABLE_NAME = 'messages' 
   AND COLUMN_NAME = 'metadata') = 0,
  'ALTER TABLE `messages` ADD COLUMN `metadata` json DEFAULT NULL COMMENT ''消息元数据'' AFTER `status`',
  'SELECT ''metadata column already exists'' as result'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加外键约束
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
   WHERE TABLE_SCHEMA = 'im_system' 
   AND TABLE_NAME = 'messages' 
   AND CONSTRAINT_NAME = 'fk_messages_ai_conversation_id') = 0,
  'ALTER TABLE `messages` ADD CONSTRAINT `fk_messages_ai_conversation_id` FOREIGN KEY (`ai_conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE SET NULL',
  'SELECT ''Foreign key constraint already exists'' as result'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 更新 messages 表的 type 枚举，添加AI消息类型（如果不存在）
ALTER TABLE `messages` 
MODIFY COLUMN `type` enum('text','image','video','audio','file','system','ai_prompt','ai_response') NOT NULL DEFAULT 'text' COMMENT '消息类型';

-- 5. 创建一些示例AI会话数据（可选）
INSERT IGNORE INTO `ai_conversations` (`user_id`, `title`, `summary`, `message_count`, `status`, `metadata`) VALUES
(1, '编程问题咨询', '关于JavaScript和React的技术问题讨论', 5, 'active', '{"model": "qwen-plus", "tags": ["programming", "javascript", "react"]}'),
(1, '项目规划讨论', '新项目的技术选型和架构设计', 8, 'active', '{"model": "qwen-plus", "tags": ["project", "architecture"]}');

-- 显示创建结果
SELECT 'AI tables created successfully' as result;

-- 显示所有表
SHOW TABLES;