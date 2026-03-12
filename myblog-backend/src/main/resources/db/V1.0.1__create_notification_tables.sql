-- 通知系统数据库表
-- 执行前请确保已选择正确的数据库

-- 通知表
CREATE TABLE IF NOT EXISTS tb_notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    receiver_id BIGINT NOT NULL COMMENT '接收者ID',
    sender_id BIGINT COMMENT '发送者ID（系统通知时为空）',
    type VARCHAR(50) NOT NULL COMMENT '通知类型：COMMENT, LIKE, FOLLOW, COLLECTION, SYSTEM, NEW_ARTICLE, MENTION, STATS, WEEKLY_DIGEST',
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
    enable_weekly_digest TINYINT DEFAULT 1 COMMENT '是否开启周报摘要通知',
    enable_websocket TINYINT DEFAULT 1 COMMENT '是否开启WebSocket推送',
    enable_browser TINYINT DEFAULT 1 COMMENT '是否开启浏览器通知',
    enable_all TINYINT DEFAULT 1 COMMENT '总开关：是否开启所有通知',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 唯一索引确保每个用户只有一条设置记录
    UNIQUE INDEX idx_user_unique (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户通知设置表';
