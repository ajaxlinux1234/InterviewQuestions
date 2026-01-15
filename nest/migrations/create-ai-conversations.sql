-- 创建 AI 会话表
CREATE TABLE IF NOT EXISTS `ai_conversations` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NOT NULL COMMENT '用户 ID',
  `title` VARCHAR(255) NULL COMMENT '会话标题',
  `summary` TEXT NULL COMMENT '会话摘要',
  `message_count` INT NOT NULL DEFAULT 0 COMMENT '消息数量',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active' COMMENT '会话状态: active, archived, deleted',
  `metadata` JSON NULL COMMENT '会话元数据',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 会话表';

-- 为 messages 表添加 ai_conversation_id 字段
ALTER TABLE `messages` 
ADD COLUMN `ai_conversation_id` BIGINT NULL COMMENT 'AI 会话 ID' AFTER `ai_prompt_id`,
ADD INDEX `idx_ai_conversation_id` (`ai_conversation_id`),
ADD FOREIGN KEY (`ai_conversation_id`) REFERENCES `ai_conversations`(`id`) ON DELETE SET NULL;
