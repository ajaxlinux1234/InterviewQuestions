-- 修改 messages 表，允许 conversation_id 为 NULL
-- 这样 AI 消息可以不关联到具体的会话

ALTER TABLE `messages` 
MODIFY COLUMN `conversation_id` BIGINT NULL;

-- 验证修改
DESCRIBE `messages`;
