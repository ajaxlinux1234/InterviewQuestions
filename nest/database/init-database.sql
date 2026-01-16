-- ========================================
-- 数据库初始化脚本
-- 用于阿里云服务器部署
-- 创建时间: 2026-01-16
-- ========================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `im_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `im_system`;

-- ========================================
-- 1. 用户认证系统表
-- ========================================

-- 用户基本信息表
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID，主键',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名，唯一标识',
  `password` VARCHAR(255) NOT NULL COMMENT '加密后的密码',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱地址（可选）',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '用户状态：1-正常，0-禁用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`) COMMENT '用户名唯一索引',
  KEY `idx_status` (`status`) COMMENT '状态索引，用于查询正常用户'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户基本信息表';

-- 用户token表
CREATE TABLE IF NOT EXISTS `user_tokens` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT 'Token记录ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID，关联users表',
  `token` VARCHAR(255) NOT NULL COMMENT 'Token字符串',
  `token_type` VARCHAR(20) NOT NULL DEFAULT 'access' COMMENT 'Token类型：access-访问令牌',
  `expires_at` TIMESTAMP NOT NULL COMMENT 'Token过期时间',
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已撤销：0-有效，1-已撤销',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `last_used_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后使用时间',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理信息',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_token` (`token`) COMMENT 'Token唯一索引',
  KEY `idx_user_id` (`user_id`) COMMENT '用户ID索引',
  KEY `idx_expires_at` (`expires_at`) COMMENT '过期时间索引',
  KEY `idx_is_revoked` (`is_revoked`) COMMENT '撤销状态索引',
  CONSTRAINT `fk_user_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户Token管理表';

-- 用户登录日志表
CREATE TABLE IF NOT EXISTS `user_login_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `user_id` BIGINT DEFAULT NULL COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '尝试登录的用户名',
  `login_result` TINYINT(1) NOT NULL COMMENT '登录结果：1-成功，0-失败',
  `failure_reason` VARCHAR(100) DEFAULT NULL COMMENT '失败原因',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '登录IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '用户代理信息',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_login_result` (`login_result`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_login_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';

-- ========================================
-- 2. IM 即时通讯系统表
-- ========================================

-- 联系人表
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `contact_user_id` BIGINT NOT NULL COMMENT '联系人用户ID',
  `remark` VARCHAR(100) COMMENT '备注名',
  `status` ENUM('normal', 'blocked') DEFAULT 'normal' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_contact` (`user_id`, `contact_user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_contact_user_id` (`contact_user_id`),
  CONSTRAINT `fk_contacts_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contacts_contact_user_id` FOREIGN KEY (`contact_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='联系人表';

-- 会话表
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('private', 'group') NOT NULL COMMENT '会话类型',
  `name` VARCHAR(100) COMMENT '会话名称',
  `avatar` VARCHAR(500) COMMENT '会话头像',
  `creator_id` BIGINT COMMENT '创建者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_type` (`type`),
  KEY `idx_creator_id` (`creator_id`),
  CONSTRAINT `fk_conversations_creator_id` FOREIGN KEY (`creator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话表';

-- 会话成员表
CREATE TABLE IF NOT EXISTS `conversation_members` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `conversation_id` BIGINT NOT NULL COMMENT '会话ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `role` ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  `muted` BOOLEAN DEFAULT FALSE COMMENT '是否免打扰',
  `last_read_message_id` BIGINT DEFAULT 0 COMMENT '最后已读消息ID',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_conversation_members_conversation_id` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_conversation_members_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会话成员表';

-- 消息表
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `conversation_id` BIGINT NOT NULL COMMENT '会话ID',
  `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
  `type` ENUM('text', 'image', 'video', 'file', 'system') NOT NULL COMMENT '消息类型',
  `content` TEXT COMMENT '消息内容',
  `media_url` VARCHAR(500) COMMENT '媒体文件URL',
  `media_size` INT COMMENT '媒体文件大小(字节)',
  `media_duration` INT COMMENT '媒体时长(秒)',
  `reply_to_message_id` BIGINT COMMENT '回复的消息ID',
  `status` ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent' COMMENT '消息状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_conversation_created` (`conversation_id`, `created_at`),
  CONSTRAINT `fk_messages_conversation_id` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender_id` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息表';

-- 消息已读状态表
CREATE TABLE IF NOT EXISTS `message_read_status` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
  `message_id` BIGINT NOT NULL COMMENT '消息ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  UNIQUE KEY `uk_message_user` (`message_id`, `user_id`),
  KEY `idx_message_id` (`message_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_message_read_status_message_id` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_message_read_status_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息已读状态表';

-- ========================================
-- 3. 仪器管理系统表
-- ========================================

-- 仪器分类表
CREATE TABLE IF NOT EXISTS `instrument_categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT '分类编码',
  `description` TEXT COMMENT '分类描述',
  `parent_id` INT DEFAULT NULL COMMENT '父分类ID',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_status` (`status`),
  KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪器分类表';

-- 仪器品牌表
CREATE TABLE IF NOT EXISTS `instrument_brands` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '品牌名称',
  `code` VARCHAR(50) UNIQUE NOT NULL COMMENT '品牌编码',
  `logo_url` VARCHAR(500) COMMENT '品牌Logo URL',
  `website` VARCHAR(200) COMMENT '官网地址',
  `country` VARCHAR(50) COMMENT '国家',
  `description` TEXT COMMENT '品牌描述',
  `status` TINYINT DEFAULT 1 COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_status` (`status`),
  KEY `idx_code` (`code`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪器品牌表';

-- 仪器主表
CREATE TABLE IF NOT EXISTS `instruments` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL COMMENT '仪器名称',
  `model` VARCHAR(100) NOT NULL COMMENT '型号',
  `serial_number` VARCHAR(100) UNIQUE NOT NULL COMMENT '序列号',
  `category_id` INT NOT NULL COMMENT '分类ID',
  `brand_id` INT NOT NULL COMMENT '品牌ID',
  `specifications` JSON COMMENT '技术规格',
  `description` TEXT COMMENT '详细描述',
  `image_urls` JSON COMMENT '图片URLs',
  `manual_url` VARCHAR(500) COMMENT '说明书URL',
  `purchase_date` DATE COMMENT '采购日期',
  `purchase_price` DECIMAL(15,2) COMMENT '采购价格',
  `supplier` VARCHAR(200) COMMENT '供应商',
  `warranty_period` INT COMMENT '保修期(月)',
  `warranty_expire_date` DATE COMMENT '保修到期日期',
  `location` VARCHAR(200) COMMENT '存放位置',
  `department` VARCHAR(100) COMMENT '所属部门',
  `responsible_person` VARCHAR(100) COMMENT '负责人',
  `contact_info` VARCHAR(200) COMMENT '联系方式',
  `status` ENUM('available', 'in_use', 'maintenance', 'retired', 'damaged') DEFAULT 'available' COMMENT '仪器状态',
  `condition_level` ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'excellent' COMMENT '设备状况',
  `last_maintenance_date` DATE COMMENT '最后维护日期',
  `next_maintenance_date` DATE COMMENT '下次维护日期',
  `usage_hours` INT DEFAULT 0 COMMENT '累计使用小时数',
  `usage_count` INT DEFAULT 0 COMMENT '使用次数',
  `created_by` BIGINT COMMENT '创建人ID',
  `updated_by` BIGINT COMMENT '更新人ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_category_id` (`category_id`),
  KEY `idx_brand_id` (`brand_id`),
  KEY `idx_status` (`status`),
  KEY `idx_condition` (`condition_level`),
  KEY `idx_department` (`department`),
  KEY `idx_location` (`location`),
  KEY `idx_serial_number` (`serial_number`),
  KEY `idx_name` (`name`),
  KEY `idx_model` (`model`),
  CONSTRAINT `fk_instruments_category_id` FOREIGN KEY (`category_id`) REFERENCES `instrument_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_instruments_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `instrument_brands` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_instruments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_instruments_updated_by` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪器主表';

-- 仪器使用记录表
CREATE TABLE IF NOT EXISTS `instrument_usage_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `instrument_id` INT NOT NULL COMMENT '仪器ID',
  `user_id` BIGINT NOT NULL COMMENT '使用者ID',
  `start_time` TIMESTAMP NOT NULL COMMENT '开始使用时间',
  `end_time` TIMESTAMP NULL COMMENT '结束使用时间',
  `duration_minutes` INT COMMENT '使用时长(分钟)',
  `purpose` VARCHAR(500) COMMENT '使用目的',
  `notes` TEXT COMMENT '使用备注',
  `status` ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing' COMMENT '使用状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_instrument_id` (`instrument_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_instrument_usage_logs_instrument_id` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_instrument_usage_logs_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪器使用记录表';

-- 仪器维护记录表
CREATE TABLE IF NOT EXISTS `instrument_maintenance_logs` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `instrument_id` INT NOT NULL COMMENT '仪器ID',
  `maintenance_type` ENUM('routine', 'repair', 'calibration', 'upgrade') NOT NULL COMMENT '维护类型',
  `maintenance_date` DATE NOT NULL COMMENT '维护日期',
  `description` TEXT NOT NULL COMMENT '维护描述',
  `cost` DECIMAL(10,2) COMMENT '维护费用',
  `technician` VARCHAR(100) COMMENT '维护技术员',
  `company` VARCHAR(200) COMMENT '维护公司',
  `next_maintenance_date` DATE COMMENT '下次维护日期',
  `attachments` JSON COMMENT '附件URLs',
  `status` ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'completed' COMMENT '维护状态',
  `created_by` BIGINT COMMENT '创建人ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_instrument_id` (`instrument_id`),
  KEY `idx_maintenance_date` (`maintenance_date`),
  KEY `idx_maintenance_type` (`maintenance_type`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_instrument_maintenance_logs_instrument_id` FOREIGN KEY (`instrument_id`) REFERENCES `instruments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_instrument_maintenance_logs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='仪器维护记录表';

-- ========================================
-- 4. 插入初始数据
-- ========================================

-- 插入测试用户 (密码使用 bcrypt 加密，这里使用明文示例，实际部署时需要加密)
INSERT INTO `users` (`username`, `password`, `email`, `status`) VALUES 
('admin', '$2b$10$YourHashedPasswordHere', 'admin@example.com', 1),
('xiaozhang', '$2b$10$YourHashedPasswordHere', 'xiaozhang@example.com', 1),
('xiaoli', '$2b$10$YourHashedPasswordHere', 'xiaoli@example.com', 1),
('xiaowang', '$2b$10$YourHashedPasswordHere', 'xiaowang@example.com', 1)
ON DUPLICATE KEY UPDATE `username`=`username`;

-- 插入仪器分类
INSERT INTO `instrument_categories` (`name`, `code`, `description`, `parent_id`, `sort_order`) VALUES
('分析仪器', 'ANALYTICAL', '用于物质成分分析的仪器', NULL, 1),
('测量仪器', 'MEASUREMENT', '用于物理量测量的仪器', NULL, 2),
('光学仪器', 'OPTICAL', '基于光学原理的仪器', NULL, 3),
('电子仪器', 'ELECTRONIC', '电子测试测量仪器', NULL, 4),
('机械仪器', 'MECHANICAL', '机械性能测试仪器', NULL, 5)
ON DUPLICATE KEY UPDATE `name`=`name`;

-- 插入仪器品牌
INSERT INTO `instrument_brands` (`name`, `code`, `website`, `country`, `description`) VALUES
('安捷伦', 'AGILENT', 'https://www.agilent.com', '美国', '全球领先的分析仪器制造商'),
('岛津', 'SHIMADZU', 'https://www.shimadzu.com', '日本', '知名分析测试仪器品牌'),
('赛默飞', 'THERMOFISHER', 'https://www.thermofisher.com', '美国', '科学仪器和实验室设备供应商'),
('蔡司', 'ZEISS', 'https://www.zeiss.com', '德国', '光学和光电子工业的领导者'),
('泰克', 'TEKTRONIX', 'https://www.tek.com', '美国', '测试测量解决方案提供商')
ON DUPLICATE KEY UPDATE `name`=`name`;

-- ========================================
-- 完成
-- ========================================
SELECT 'Database initialization completed successfully!' AS message;
