# 数据库架构迁移说明

## 问题描述

生产服务器的数据库缺少以下列：

- `users` 表缺少 `last_seen` 列
- `users` 表的 `password_hash` 列需要重命名为 `password`
- `messages` 表缺少 `ai_prompt_id`, `ai_conversation_id`, `metadata` 列
- `messages` 表的 `type` 枚举需要添加 `ai_prompt` 和 `ai_response`

## 迁移方法

### 方法 1: 使用迁移脚本（推荐）

1. 上传文件到服务器：

```bash
# 在本地执行
scp nest/database/migrate-schema.sql root@your-server:/path/to/nest/database/
scp nest/database/migrate-schema.sh root@your-server:/path/to/nest/database/
```

2. 在服务器上执行：

```bash
cd /path/to/nest/database
chmod +x migrate-schema.sh
./migrate-schema.sh
```

3. 重启应用：

```bash
pm2 restart nest-backend
```

### 方法 2: 直接执行 SQL（快速）

在服务器上直接执行：

```bash
cd /path/to/nest/database
mysql -u root -p im_system < migrate-schema.sql
pm2 restart nest-backend
```

### 方法 3: 手动执行 SQL 命令

如果你更喜欢手动控制，可以逐条执行：

```bash
mysql -u root -p
```

然后在 MySQL 命令行中执行：

```sql
USE im_system;

-- 添加 last_seen 列
ALTER TABLE users ADD COLUMN last_seen TIMESTAMP NULL COMMENT '最后在线时间' AFTER email;

-- 重命名 password_hash 为 password（如果存在）
ALTER TABLE users CHANGE COLUMN password_hash password VARCHAR(255) NOT NULL;

-- 修改 messages 表的 type 枚举
ALTER TABLE messages
  MODIFY COLUMN type ENUM('text', 'image', 'video', 'file', 'system', 'ai_prompt', 'ai_response') NOT NULL;

-- 添加 AI 相关列
ALTER TABLE messages
  ADD COLUMN ai_prompt_id BIGINT NULL AFTER reply_to_message_id,
  ADD COLUMN ai_conversation_id BIGINT NULL AFTER ai_prompt_id,
  ADD COLUMN metadata JSON NULL AFTER ai_conversation_id,
  ADD INDEX idx_ai_prompt_id (ai_prompt_id),
  ADD INDEX idx_ai_conversation_id (ai_conversation_id);
```

退出 MySQL 并重启应用：

```bash
exit
pm2 restart nest-backend
```

## 验证迁移

迁移完成后，验证表结构：

```bash
mysql -u root -p im_system -e "DESCRIBE users;"
mysql -u root -p im_system -e "DESCRIBE messages;"
```

检查应用日志：

```bash
pm2 logs nest-backend --lines 50
```

## 注意事项

1. **备份数据库**：在执行迁移前，建议先备份数据库

   ```bash
   mysqldump -u root -p im_system > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **检查数据库名称**：确认你的 `.env` 文件中的 `MYSQL_DATABASE` 配置

   - 如果是 `im_service`，将上述命令中的 `im_system` 替换为 `im_service`

3. **权限问题**：确保 MySQL 用户有 ALTER TABLE 权限

4. **应用重启**：迁移完成后必须重启 NestJS 应用才能生效

## 故障排除

### 错误: Column already exists

如果某些列已经存在，这是正常的。迁移脚本会跳过已存在的列。

### 错误: Access denied

确保使用的 MySQL 用户有足够的权限执行 ALTER TABLE 操作。

### 应用仍然报错

1. 确认迁移已成功执行
2. 确认已重启应用：`pm2 restart nest-backend`
3. 检查 `.env` 文件中的数据库配置是否正确
4. 查看完整的错误日志：`pm2 logs nest-backend --err --lines 100`
