# 用户认证系统数据库设计说明

## 设计原则

### 1. 安全性优先
- **密码加密存储**：使用MD5加密（虽然MD5相对较弱，但满足基本需求）
- **Token管理**：独立的token表，支持token撤销和过期管理
- **登录日志**：记录所有登录尝试，便于安全审计

### 2. 可扩展性
- **用户表预留字段**：email、status等字段为后续功能扩展做准备
- **Token类型**：支持不同类型的token（access、refresh等）
- **外键约束**：保证数据一致性

### 3. 性能优化
- **合理索引**：在查询频繁的字段上建立索引
- **分表设计**：将token和日志独立存储，避免主表过大

## 表结构详解

### 1. users 表（用户基本信息）

```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,           -- 主键，自增
  `username` varchar(50) NOT NULL,               -- 用户名，50字符足够
  `password` varchar(32) NOT NULL,               -- MD5固定32位
  `email` varchar(100) DEFAULT NULL,             -- 邮箱，预留扩展
  `status` tinyint(1) NOT NULL DEFAULT 1,        -- 状态控制
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),          -- 用户名唯一
  KEY `idx_status` (`status`)                     -- 状态索引
);
```

**设计理由：**
- `id`：使用自增整型主键，查询效率高
- `username`：设置唯一索引，防止重复注册
- `password`：varchar(32)正好存储MD5结果
- `status`：软删除设计，便于用户管理
- `created_at/updated_at`：审计字段，自动维护时间

### 2. user_tokens 表（Token管理）

```sql
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,                    -- 关联用户
  `token` varchar(255) NOT NULL,                 -- 存储token
  `token_type` varchar(20) NOT NULL DEFAULT 'access',
  `expires_at` timestamp NOT NULL,               -- 过期时间
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0,    -- 撤销标记
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` timestamp NULL DEFAULT NULL,    -- 最后使用时间
  `user_agent` varchar(500) DEFAULT NULL,        -- 设备信息
  `ip_address` varchar(45) DEFAULT NULL,         -- IP地址
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`),                -- token唯一
  KEY `idx_user_id` (`user_id`),
  KEY `idx_expires_at` (`expires_at`),            -- 清理过期token
  CONSTRAINT `fk_user_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**设计理由：**
- **独立token表**：避免用户表过于复杂，支持一用户多token
- **过期时间索引**：便于定期清理过期token
- **撤销机制**：支持主动注销，不依赖token过期
- **审计信息**：记录IP和设备信息，增强安全性
- **外键约束**：用户删除时自动清理相关token

### 3. user_login_logs 表（登录日志）

```sql
CREATE TABLE `user_login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,                -- 可为空，登录失败时
  `username` varchar(50) NOT NULL,               -- 记录尝试的用户名
  `login_result` tinyint(1) NOT NULL,            -- 成功/失败
  `failure_reason` varchar(100) DEFAULT NULL,    -- 失败原因
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_created_at` (`created_at`)             -- 时间范围查询
);
```

**设计理由：**
- **安全审计**：记录所有登录尝试，便于发现异常
- **失败分析**：记录失败原因，便于问题排查
- **时间索引**：支持按时间范围查询日志

## 索引设计说明

### 1. 主键索引
- 所有表都使用自增整型主键，聚簇索引效率高

### 2. 唯一索引
- `users.username`：防止用户名重复
- `user_tokens.token`：防止token冲突

### 3. 普通索引
- `users.status`：按状态查询用户
- `user_tokens.user_id`：查询用户的所有token
- `user_tokens.expires_at`：清理过期token
- `user_login_logs.created_at`：按时间查询日志

## 安全考虑

### 1. 密码安全
- 前端MD5加密，防止明文传输
- 数据库存储加密后的密码

### 2. Token安全
- 支持token撤销，防止token泄露风险
- 记录token使用情况，便于异常检测

### 3. 审计日志
- 完整的登录日志，便于安全分析
- 记录IP和设备信息，支持风险识别

## 性能优化

### 1. 查询优化
- 合理的索引设计，覆盖常用查询场景
- 外键约束保证数据一致性

### 2. 存储优化
- 字段长度合理设置，避免空间浪费
- 使用合适的数据类型（tinyint、timestamp等）

### 3. 维护优化
- 自动更新时间戳
- 支持软删除，避免数据丢失