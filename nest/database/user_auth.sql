-- 用户认证系统数据库设计

-- 1. 用户基本信息表
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
  `username` varchar(50) NOT NULL COMMENT '用户名，唯一标识',
  `password` varchar(32) NOT NULL COMMENT 'MD5加密后的密码',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱地址（可选）',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '用户状态：1-正常，0-禁用',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`) COMMENT '用户名唯一索引',
  KEY `idx_status` (`status`) COMMENT '状态索引，用于查询正常用户'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户基本信息表';

-- 2. 用户token表（用于管理登录状态）
CREATE TABLE `user_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'Token记录ID',
  `user_id` int(11) NOT NULL COMMENT '用户ID，关联users表',
  `token` varchar(255) NOT NULL COMMENT 'JWT token或随机生成的token',
  `token_type` varchar(20) NOT NULL DEFAULT 'access' COMMENT 'Token类型：access-访问令牌',
  `expires_at` timestamp NOT NULL COMMENT 'Token过期时间',
  `is_revoked` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否已撤销：0-有效，1-已撤销',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_used_at` timestamp NULL DEFAULT NULL COMMENT '最后使用时间',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理信息',
  `ip_address` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`) COMMENT 'Token唯一索引',
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_expires_at` (`expires_at`) COMMENT '过期时间索引，用于清理过期token',
  KEY `idx_is_revoked` (`is_revoked`) COMMENT '撤销状态索引',
  CONSTRAINT `fk_user_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户Token管理表';

-- 3. 用户登录日志表（可选，用于安全审计）
CREATE TABLE `user_login_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` int(11) DEFAULT NULL COMMENT '用户ID，登录失败时可能为空',
  `username` varchar(50) NOT NULL COMMENT '尝试登录的用户名',
  `login_result` tinyint(1) NOT NULL COMMENT '登录结果：1-成功，0-失败',
  `failure_reason` varchar(100) DEFAULT NULL COMMENT '失败原因：用户不存在、密码错误等',
  `ip_address` varchar(45) DEFAULT NULL COMMENT '登录IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '用户代理信息',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_username` (`username`) COMMENT '用户名索引',
  KEY `idx_login_result` (`login_result`) COMMENT '登录结果索引',
  KEY `idx_created_at` (`created_at`) COMMENT '时间索引，用于日志查询',
  CONSTRAINT `fk_login_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户登录日志表';

-- 插入测试数据
INSERT INTO `users` (`username`, `password`, `email`) VALUES 
('admin', MD5('admin123'), 'admin@example.com'),
('testuser', MD5('test123'), 'test@example.com');