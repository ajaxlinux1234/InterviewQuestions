-- 仪器管理系统数据库设计
-- 创建时间: 2026-01-13

-- 1. 仪器分类表
CREATE TABLE instrument_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '分类名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '分类编码',
  description TEXT COMMENT '分类描述',
  parent_id INT DEFAULT NULL COMMENT '父分类ID',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_id (parent_id),
  INDEX idx_status (status),
  INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪器分类表';

-- 2. 仪器品牌表
CREATE TABLE instrument_brands (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '品牌名称',
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '品牌编码',
  logo_url VARCHAR(500) COMMENT '品牌Logo URL',
  website VARCHAR(200) COMMENT '官网地址',
  country VARCHAR(50) COMMENT '国家',
  description TEXT COMMENT '品牌描述',
  status TINYINT DEFAULT 1 COMMENT '状态: 1-启用, 0-禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_code (code),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪器品牌表';

-- 3. 仪器主表
CREATE TABLE instruments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL COMMENT '仪器名称',
  model VARCHAR(100) NOT NULL COMMENT '型号',
  serial_number VARCHAR(100) UNIQUE NOT NULL COMMENT '序列号/资产编号',
  category_id INT NOT NULL COMMENT '分类ID',
  brand_id INT NOT NULL COMMENT '品牌ID',
  
  -- 基本信息
  specifications JSON COMMENT '技术规格(JSON格式)',
  description TEXT COMMENT '详细描述',
  image_urls JSON COMMENT '图片URLs(JSON数组)',
  manual_url VARCHAR(500) COMMENT '说明书URL',
  
  -- 采购信息
  purchase_date DATE COMMENT '采购日期',
  purchase_price DECIMAL(15,2) COMMENT '采购价格',
  supplier VARCHAR(200) COMMENT '供应商',
  warranty_period INT COMMENT '保修期(月)',
  warranty_expire_date DATE COMMENT '保修到期日期',
  
  -- 位置信息
  location VARCHAR(200) COMMENT '存放位置',
  department VARCHAR(100) COMMENT '所属部门',
  responsible_person VARCHAR(100) COMMENT '负责人',
  contact_info VARCHAR(200) COMMENT '联系方式',
  
  -- 状态信息
  status ENUM('available', 'in_use', 'maintenance', 'retired', 'damaged') DEFAULT 'available' COMMENT '仪器状态',
  condition_level ENUM('excellent', 'good', 'fair', 'poor') DEFAULT 'excellent' COMMENT '设备状况',
  last_maintenance_date DATE COMMENT '最后维护日期',
  next_maintenance_date DATE COMMENT '下次维护日期',
  
  -- 使用统计
  usage_hours INT DEFAULT 0 COMMENT '累计使用小时数',
  usage_count INT DEFAULT 0 COMMENT '使用次数',
  
  -- 系统字段
  created_by BIGINT COMMENT '创建人ID',
  updated_by BIGINT COMMENT '更新人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引优化(高性能查询)
  INDEX idx_category_id (category_id),
  INDEX idx_brand_id (brand_id),
  INDEX idx_status (status),
  INDEX idx_condition (condition_level),
  INDEX idx_department (department),
  INDEX idx_location (location),
  INDEX idx_serial_number (serial_number),
  INDEX idx_name (name),
  INDEX idx_model (model),
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at),
  
  -- 复合索引(优化常用查询组合)
  INDEX idx_category_status (category_id, status),
  INDEX idx_brand_status (brand_id, status),
  INDEX idx_department_status (department, status),
  INDEX idx_name_model (name, model),
  
  -- 全文索引(支持搜索)
  FULLTEXT INDEX ft_search (name, model, description, location, department),
  
  -- 外键约束
  FOREIGN KEY (category_id) REFERENCES instrument_categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (brand_id) REFERENCES instrument_brands(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪器主表';

-- 4. 仪器使用记录表
CREATE TABLE instrument_usage_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instrument_id INT NOT NULL COMMENT '仪器ID',
  user_id BIGINT NOT NULL COMMENT '使用者ID',
  start_time TIMESTAMP NOT NULL COMMENT '开始使用时间',
  end_time TIMESTAMP NULL COMMENT '结束使用时间',
  duration_minutes INT COMMENT '使用时长(分钟)',
  purpose VARCHAR(500) COMMENT '使用目的',
  notes TEXT COMMENT '使用备注',
  status ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing' COMMENT '使用状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_instrument_id (instrument_id),
  INDEX idx_user_id (user_id),
  INDEX idx_start_time (start_time),
  INDEX idx_status (status),
  INDEX idx_instrument_start (instrument_id, start_time),
  
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪器使用记录表';

-- 5. 仪器维护记录表
CREATE TABLE instrument_maintenance_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  instrument_id INT NOT NULL COMMENT '仪器ID',
  maintenance_type ENUM('routine', 'repair', 'calibration', 'upgrade') NOT NULL COMMENT '维护类型',
  maintenance_date DATE NOT NULL COMMENT '维护日期',
  description TEXT NOT NULL COMMENT '维护描述',
  cost DECIMAL(10,2) COMMENT '维护费用',
  technician VARCHAR(100) COMMENT '维护技术员',
  company VARCHAR(200) COMMENT '维护公司',
  next_maintenance_date DATE COMMENT '下次维护日期',
  attachments JSON COMMENT '附件URLs',
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') DEFAULT 'completed' COMMENT '维护状态',
  created_by BIGINT COMMENT '创建人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_instrument_id (instrument_id),
  INDEX idx_maintenance_date (maintenance_date),
  INDEX idx_maintenance_type (maintenance_type),
  INDEX idx_status (status),
  INDEX idx_next_maintenance (next_maintenance_date),
  
  FOREIGN KEY (instrument_id) REFERENCES instruments(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仪器维护记录表';

-- 插入初始数据

-- 插入仪器分类
INSERT INTO instrument_categories (name, code, description, parent_id, sort_order) VALUES
('分析仪器', 'ANALYTICAL', '用于物质成分分析的仪器', NULL, 1),
('测量仪器', 'MEASUREMENT', '用于物理量测量的仪器', NULL, 2),
('光学仪器', 'OPTICAL', '基于光学原理的仪器', NULL, 3),
('电子仪器', 'ELECTRONIC', '电子测试测量仪器', NULL, 4),
('机械仪器', 'MECHANICAL', '机械性能测试仪器', NULL, 5),
('色谱仪', 'CHROMATOGRAPHY', '色谱分析仪器', 1, 1),
('光谱仪', 'SPECTROSCOPY', '光谱分析仪器', 1, 2),
('显微镜', 'MICROSCOPE', '显微观察仪器', 3, 1),
('万用表', 'MULTIMETER', '电子测量仪表', 4, 1),
('示波器', 'OSCILLOSCOPE', '波形显示仪器', 4, 2);

-- 插入仪器品牌
INSERT INTO instrument_brands (name, code, logo_url, website, country, description) VALUES
('安捷伦', 'AGILENT', '', 'https://www.agilent.com', '美国', '全球领先的分析仪器制造商'),
('岛津', 'SHIMADZU', '', 'https://www.shimadzu.com', '日本', '知名分析测试仪器品牌'),
('赛默飞', 'THERMOFISHER', '', 'https://www.thermofisher.com', '美国', '科学仪器和实验室设备供应商'),
('蔡司', 'ZEISS', '', 'https://www.zeiss.com', '德国', '光学和光电子工业的领导者'),
('泰克', 'TEKTRONIX', '', 'https://www.tek.com', '美国', '测试测量解决方案提供商'),
('福禄克', 'FLUKE', '', 'https://www.fluke.com', '美国', '电子测试工具和软件的领导者'),
('海光', 'HAIGUANG', '', 'https://www.haiguang.com', '中国', '国产分析仪器制造商'),
('奥林巴斯', 'OLYMPUS', '', 'https://www.olympus.com', '日本', '光学和数字解决方案的全球领导者');

-- 插入示例仪器数据
INSERT INTO instruments (
  name, model, serial_number, category_id, brand_id,
  specifications, description, purchase_date, purchase_price,
  supplier, location, department, responsible_person,
  status, condition_level, created_by
) VALUES
(
  '气相色谱仪', 'GC-2030', 'GC2030001', 6, 2,
  '{"detection_limit": "1ppm", "temperature_range": "50-450°C", "carrier_gas": "氮气,氢气,氦气"}',
  '高精度气相色谱仪，适用于有机化合物分析',
  '2023-06-15', 280000.00, '岛津企业管理(中国)有限公司',
  '实验楼3层分析室', '质量检测部', '张工程师',
  'available', 'excellent', 1
),
(
  '液相色谱仪', 'LC-20A', 'LC20A001', 6, 2,
  '{"flow_rate": "0.001-10ml/min", "pressure": "0-40MPa", "detector": "UV-VIS"}',
  '高效液相色谱仪，用于药物成分分析',
  '2023-08-20', 320000.00, '岛津企业管理(中国)有限公司',
  '实验楼3层分析室', '质量检测部', '李工程师',
  'in_use', 'good', 1
),
(
  '原子吸收光谱仪', 'AA-7000', 'AA7000001', 7, 2,
  '{"wavelength_range": "185-900nm", "detection_limit": "0.1ppm", "flame_type": "空气-乙炔"}',
  '原子吸收分光光度计，用于金属元素分析',
  '2023-09-10', 450000.00, '岛津企业管理(中国)有限公司',
  '实验楼2层光谱室', '材料分析部', '王工程师',
  'available', 'excellent', 1
),
(
  '扫描电子显微镜', 'SEM-3000', 'SEM3000001', 8, 4,
  '{"magnification": "10x-500000x", "resolution": "1nm", "acceleration_voltage": "0.5-30kV"}',
  '高分辨率扫描电子显微镜，用于材料微观结构观察',
  '2023-10-05', 1200000.00, '蔡司(上海)管理有限公司',
  '实验楼1层电镜室', '材料研究部', '赵教授',
  'maintenance', 'good', 1
),
(
  '数字示波器', 'MSO64', 'MSO64001', 10, 5,
  '{"bandwidth": "1GHz", "sample_rate": "25GS/s", "channels": "4+16"}',
  '混合信号示波器，用于电子信号测试',
  '2023-11-12', 85000.00, '泰克科技(中国)有限公司',
  '实验楼4层电子实验室', '电子工程部', '陈工程师',
  'available', 'excellent', 1
);

-- 创建视图用于高性能查询
CREATE VIEW v_instruments_summary AS
SELECT 
  i.id,
  i.name,
  i.model,
  i.serial_number,
  c.name as category_name,
  c.code as category_code,
  b.name as brand_name,
  b.code as brand_code,
  i.status,
  i.condition_level,
  i.location,
  i.department,
  i.responsible_person,
  i.purchase_date,
  i.purchase_price,
  i.last_maintenance_date,
  i.next_maintenance_date,
  i.usage_hours,
  i.usage_count,
  i.created_at,
  i.updated_at
FROM instruments i
LEFT JOIN instrument_categories c ON i.category_id = c.id
LEFT JOIN instrument_brands b ON i.brand_id = b.id
WHERE i.status != 'retired';

-- 创建存储过程用于高性能分页查询
DELIMITER //
CREATE PROCEDURE GetInstrumentsPaginated(
  IN p_page INT,
  IN p_limit INT,
  IN p_search VARCHAR(200),
  IN p_category_id INT,
  IN p_brand_id INT,
  IN p_status VARCHAR(20),
  IN p_department VARCHAR(100),
  OUT p_total INT
)
BEGIN
  DECLARE v_offset INT DEFAULT 0;
  
  SET v_offset = (p_page - 1) * p_limit;
  
  -- 构建动态查询条件
  SET @sql = 'SELECT SQL_CALC_FOUND_ROWS * FROM v_instruments_summary WHERE 1=1';
  
  IF p_search IS NOT NULL AND p_search != '' THEN
    SET @sql = CONCAT(@sql, ' AND (name LIKE ''%', p_search, '%'' OR model LIKE ''%', p_search, '%'' OR serial_number LIKE ''%', p_search, '%'')');
  END IF;
  
  IF p_category_id IS NOT NULL AND p_category_id > 0 THEN
    SET @sql = CONCAT(@sql, ' AND category_id = ', p_category_id);
  END IF;
  
  IF p_brand_id IS NOT NULL AND p_brand_id > 0 THEN
    SET @sql = CONCAT(@sql, ' AND brand_id = ', p_brand_id);
  END IF;
  
  IF p_status IS NOT NULL AND p_status != '' THEN
    SET @sql = CONCAT(@sql, ' AND status = ''', p_status, '''');
  END IF;
  
  IF p_department IS NOT NULL AND p_department != '' THEN
    SET @sql = CONCAT(@sql, ' AND department = ''', p_department, '''');
  END IF;
  
  SET @sql = CONCAT(@sql, ' ORDER BY updated_at DESC LIMIT ', v_offset, ', ', p_limit);
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
  
  SELECT FOUND_ROWS() INTO p_total;
END //
DELIMITER ;

-- 创建索引优化查询性能
CREATE INDEX idx_instruments_search ON instruments(name, model, serial_number);
CREATE INDEX idx_instruments_filters ON instruments(category_id, brand_id, status, department);
CREATE INDEX idx_instruments_dates ON instruments(purchase_date, last_maintenance_date, next_maintenance_date);

-- 创建触发器自动更新统计信息
DELIMITER //
CREATE TRIGGER tr_usage_log_insert 
AFTER INSERT ON instrument_usage_logs
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND NEW.duration_minutes IS NOT NULL THEN
    UPDATE instruments 
    SET 
      usage_count = usage_count + 1,
      usage_hours = usage_hours + ROUND(NEW.duration_minutes / 60, 2)
    WHERE id = NEW.instrument_id;
  END IF;
END //

CREATE TRIGGER tr_usage_log_update
AFTER UPDATE ON instrument_usage_logs
FOR EACH ROW
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.duration_minutes IS NOT NULL THEN
    UPDATE instruments 
    SET 
      usage_count = usage_count + 1,
      usage_hours = usage_hours + ROUND(NEW.duration_minutes / 60, 2)
    WHERE id = NEW.instrument_id;
  END IF;
END //
DELIMITER ;