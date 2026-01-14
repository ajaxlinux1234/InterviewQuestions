-- IM 即时通讯系统数据库设计
-- 创建时间: 2026-01-13

-- 1. 联系人表
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  contact_user_id BIGINT NOT NULL COMMENT '联系人用户ID',
  remark VARCHAR(100) COMMENT '备注名',
  status ENUM('normal', 'blocked') DEFAULT 'normal' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_user_contact (user_id, contact_user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_contact_user_id (contact_user_id),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系人表';

-- 2. 会话表
CREATE TABLE conversations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('private', 'group') NOT NULL COMMENT '会话类型: private-私聊, group-群聊',
  name VARCHAR(100) COMMENT '会话名称(群聊名称)',
  avatar VARCHAR(500) COMMENT '会话头像',
  creator_id BIGINT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_creator_id (creator_id),
  
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话表';

-- 3. 会话成员表
CREATE TABLE conversation_members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL COMMENT '会话ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role ENUM('owner', 'admin', 'member') DEFAULT 'member' COMMENT '角色',
  muted BOOLEAN DEFAULT FALSE COMMENT '是否免打扰',
  last_read_message_id BIGINT DEFAULT 0 COMMENT '最后已读消息ID',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  
  UNIQUE KEY uk_conversation_user (conversation_id, user_id),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_user_id (user_id),
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话成员表';

-- 4. 消息表
CREATE TABLE messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  conversation_id BIGINT NOT NULL COMMENT '会话ID',
  sender_id BIGINT NOT NULL COMMENT '发送者ID',
  type ENUM('text', 'image', 'video', 'file', 'system') NOT NULL COMMENT '消息类型',
  content TEXT COMMENT '消息内容',
  media_url VARCHAR(500) COMMENT '媒体文件URL',
  media_size INT COMMENT '媒体文件大小(字节)',
  media_duration INT COMMENT '媒体时长(秒)',
  reply_to_message_id BIGINT COMMENT '回复的消息ID',
  status ENUM('sending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent' COMMENT '消息状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_created_at (created_at),
  INDEX idx_conversation_created (conversation_id, created_at),
  
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 5. 消息已读状态表
CREATE TABLE message_read_status (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  message_id BIGINT NOT NULL COMMENT '消息ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  
  UNIQUE KEY uk_message_user (message_id, user_id),
  INDEX idx_message_id (message_id),
  INDEX idx_user_id (user_id),
  
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息已读状态表';

-- 插入测试数据

-- 插入联系人关系
INSERT INTO contacts (user_id, contact_user_id, remark, status) VALUES
(1, 2, '小明', 'normal'),
(1, 4, '测试用户2', 'normal'),
(2, 1, 'testuser123', 'normal'),
(4, 1, 'testuser123', 'normal');

-- 插入私聊会话
INSERT INTO conversations (type, creator_id) VALUES
('private', 1),
('private', 1);

-- 插入群聊会话
INSERT INTO conversations (type, name, avatar, creator_id) VALUES
('group', '技术交流群', '', 1),
('group', '项目讨论组', '', 1);

-- 插入会话成员
-- 私聊会话1: user1 和 user2
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(1, 1, 'member'),
(1, 2, 'member');

-- 私聊会话2: user1 和 user4
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(2, 1, 'member'),
(2, 4, 'member');

-- 群聊会话1: user1(owner), user2, user4
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(3, 1, 'owner'),
(3, 2, 'member'),
(3, 4, 'member');

-- 群聊会话2: user1(owner), user2
INSERT INTO conversation_members (conversation_id, user_id, role) VALUES
(4, 1, 'owner'),
(4, 2, 'member');

-- 插入测试消息
INSERT INTO messages (conversation_id, sender_id, type, content, status) VALUES
(1, 1, 'text', '你好，这是第一条消息', 'read'),
(1, 2, 'text', '你好！收到了', 'read'),
(1, 1, 'text', '今天天气不错', 'read'),
(2, 1, 'text', 'Hi, 测试用户2', 'sent'),
(2, 4, 'text', 'Hello!', 'sent'),
(3, 1, 'text', '欢迎大家加入技术交流群', 'read'),
(3, 2, 'text', '谢谢！', 'read'),
(3, 4, 'text', '很高兴认识大家', 'read'),
(3, 1, 'text', '今天我们讨论一下新项目', 'sent'),
(4, 1, 'text', '项目讨论组已创建', 'sent');

-- 创建视图：会话列表视图
CREATE VIEW v_conversation_list AS
SELECT 
  c.id AS conversation_id,
  c.type,
  c.name,
  c.avatar,
  c.created_at,
  cm.user_id,
  cm.muted,
  cm.last_read_message_id,
  (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.id > cm.last_read_message_id) AS unread_count,
  (SELECT m.content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_content,
  (SELECT m.type FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_type,
  (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
  (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_sender_id
FROM conversations c
INNER JOIN conversation_members cm ON c.id = cm.conversation_id;

-- 创建存储过程：获取会话列表
DELIMITER //
CREATE PROCEDURE GetConversationList(
  IN p_user_id BIGINT,
  IN p_page INT,
  IN p_limit INT,
  OUT p_total INT
)
BEGIN
  DECLARE v_offset INT DEFAULT 0;
  
  SET v_offset = (p_page - 1) * p_limit;
  
  -- 获取总数
  SELECT COUNT(*) INTO p_total
  FROM v_conversation_list
  WHERE user_id = p_user_id;
  
  -- 获取会话列表
  SELECT *
  FROM v_conversation_list
  WHERE user_id = p_user_id
  ORDER BY last_message_time DESC
  LIMIT v_offset, p_limit;
END //
DELIMITER ;

-- 创建触发器：更新会话最后消息时间
DELIMITER //
CREATE TRIGGER tr_message_insert_update_conversation
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
END //
DELIMITER ;
