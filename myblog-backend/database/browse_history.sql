-- ============================================
-- 浏览记录表创建脚本
-- 功能：记录用户浏览文章的历史，支持去重
-- 创建时间: 2025-12-24
-- ============================================

USE myblog;

-- 创建浏览记录表
CREATE TABLE IF NOT EXISTS tb_browse_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '浏览记录ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    blog_id BIGINT NOT NULL COMMENT '文章ID',
    browse_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间（最新浏览时间）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    
    -- 唯一键：确保同一用户对同一文章只有一条记录
    UNIQUE KEY uk_user_blog (user_id, blog_id, deleted),
    
    -- 复合索引：优化查询用户浏览记录的性能
    INDEX idx_user_browse_time (user_id, browse_time DESC, deleted),
    
    -- 单列索引：支持按文章查询
    INDEX idx_blog_id (blog_id),
    
    -- 单列索引：支持按时间清理过期数据
    INDEX idx_browse_time (browse_time),
    
    -- 外键约束
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (blog_id) REFERENCES tb_blog(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户浏览记录表';

-- 完成提示
SELECT '浏览记录表创建完成！' as status;
