-- 用户关注关系表的数据库迁移脚本
-- 创建时间: 2025-12-12
-- 说明: 此脚本创建用户关注功能所需的表结构
-- 使用方式: 在生产环境执行此脚本以添加关注功能
-- 注意: 执行前请确保已连接到正确的数据库

USE myblog;

-- 创建用户关注关系表
CREATE TABLE IF NOT EXISTS tb_user_follow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关注关系ID',
    follower_id BIGINT NOT NULL COMMENT '关注者ID（粉丝）',
    followee_id BIGINT NOT NULL COMMENT '被关注者ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    
    -- 唯一索引：防止重复关注（同一个用户对同一目标用户只能有一条有效的关注记录）
    UNIQUE KEY uk_follower_followee (follower_id, followee_id, deleted),
    
    -- 索引：优化查询粉丝列表（谁关注了我）
    INDEX idx_followee_id (followee_id, deleted, create_time),
    
    -- 索引：优化查询关注列表（我关注了谁）
    INDEX idx_follower_id (follower_id, deleted, create_time),
    
    -- 索引：优化按时间查询
    INDEX idx_create_time (create_time),
    
    -- 外键约束：确保数据一致性
    FOREIGN KEY (follower_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注关系表';

-- 验证表是否创建成功
SELECT 
    'tb_user_follow 表创建成功' AS message,
    COUNT(*) AS table_count 
FROM information_schema.tables 
WHERE table_schema = 'myblog' 
AND table_name = 'tb_user_follow';

-- 显示表结构
DESCRIBE tb_user_follow;

-- 显示索引信息
SHOW INDEX FROM tb_user_follow;
