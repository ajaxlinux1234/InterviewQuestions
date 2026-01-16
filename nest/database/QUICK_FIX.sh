#!/bin/bash
# 快速修复脚本 - 在服务器上直接运行

echo "正在修复数据库架构..."

# 从 .env 读取配置或使用默认值
DB_HOST="${MYSQL_HOST:-localhost}"
DB_USER="${MYSQL_USER:-root}"
DB_NAME="${MYSQL_DATABASE:-im_system}"

# 提示输入密码
echo "请输入 MySQL 密码:"
read -s DB_PASS

# 执行修复
mysql -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" << 'EOF'
-- 修复 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP NULL COMMENT '最后在线时间' AFTER email;

-- 修复 messages 表
ALTER TABLE messages 
  MODIFY COLUMN type ENUM('text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response') NOT NULL;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_prompt_id BIGINT NULL AFTER reply_to_message_id;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_conversation_id BIGINT NULL AFTER ai_prompt_id;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSON NULL AFTER ai_conversation_id;

SELECT 'Migration completed!' AS status;
EOF

if [ $? -eq 0 ]; then
    echo "✓ 数据库修复成功!"
    echo "请重启应用: pm2 restart nest-backend"
else
    echo "✗ 数据库修复失败，请检查错误信息"
fi
