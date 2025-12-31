-- V1.0.1 Notification Tables Migration for Production

USE myblog;

-- 通知表
CREATE TABLE IF NOT EXISTS tb_notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receiver_id BIGINT NOT NULL COMMENT '接收者ID',
    sender_id BIGINT COMMENT '发送者ID（系统通知时为空）',
    type VARCHAR(50) NOT NULL COMMENT '通知类型：COMMENT, LIKE, FOLLOW, COLLECTION, SYSTEM, NEW_ARTICLE, MENTION, STATS',
    title VARCHAR(200) NOT NULL COMMENT '通知标题',
    content TEXT COMMENT '通知内容',
    resource_type VARCHAR(50) COMMENT '资源类型：BLOG, COMMENT, USER',
    resource_id BIGINT COMMENT '资源ID',
    extra_data JSON COMMENT '扩展数据（JSON格式）',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
    read_time DATETIME COMMENT '阅读时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    
    -- 索引优化
    INDEX idx_receiver_read_time (receiver_id, is_read, create_time DESC) COMMENT '用于查询用户未读通知列表',
    INDEX idx_receiver_type_time (receiver_id, type, create_time DESC) COMMENT '用于按类型筛选通知',
    INDEX idx_sender (sender_id) COMMENT '用于查询发送者相关通知',
    INDEX idx_resource (resource_type, resource_id) COMMENT '用于查询资源相关通知',
    INDEX idx_cleanup (create_time, deleted) COMMENT '用于定期清理旧通知'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知表';


-- 通知设置表
CREATE TABLE IF NOT EXISTS tb_notification_setting (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    enable_comment TINYINT DEFAULT 1 COMMENT '是否开启评论通知',
    enable_like TINYINT DEFAULT 1 COMMENT '是否开启点赞通知',
    enable_follow TINYINT DEFAULT 1 COMMENT '是否开启关注通知',
    enable_collection TINYINT DEFAULT 1 COMMENT '是否开启收藏通知',
    enable_system TINYINT DEFAULT 1 COMMENT '是否开启系统通知',
    enable_new_article TINYINT DEFAULT 1 COMMENT '是否开启新文章通知',
    enable_mention TINYINT DEFAULT 1 COMMENT '是否开启@提及通知',
    enable_stats TINYINT DEFAULT 1 COMMENT '是否开启统计通知',
    enable_websocket TINYINT DEFAULT 1 COMMENT '是否开启WebSocket推送',
    enable_browser TINYINT DEFAULT 1 COMMENT '是否开启浏览器通知',
    enable_all TINYINT DEFAULT 1 COMMENT '总开关：是否开启所有通知',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 唯一索引确保每个用户只有一条设置记录
    UNIQUE INDEX idx_user_unique (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知设置表';

-- 兼容性字段添加 (如果已存在会跳过或报错，建议加上 IF NOT EXISTS 逻辑，但MySQL ADD COLUMN 不支持 IF NOT EXISTS，只能硬来或忽略错误)
-- 这里使用存储过程或简单的尝试执行

-- 尝试添加 like_count
SET @dbname = DATABASE();
SET @tablename = "tb_blog";
SET @columnname = "like_count";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE tb_blog ADD COLUMN like_count INT DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 尝试添加 comment_count
SET @columnname = "comment_count";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  "SELECT 1",
  "ALTER TABLE tb_blog ADD COLUMN comment_count INT DEFAULT 0"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 为现有用户初始化通知设置
INSERT IGNORE INTO tb_notification_setting (user_id)
SELECT id FROM tb_user;
