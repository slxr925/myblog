-- 收藏夹分类表
CREATE TABLE IF NOT EXISTS tb_collection_folder (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description VARCHAR(255) COMMENT '分类描述',
    is_default TINYINT DEFAULT 0 COMMENT '是否默认分类：0-否，1-是',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    collection_count INT DEFAULT 0 COMMENT '收藏数量（冗余字段，提升查询性能）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    UNIQUE KEY uk_user_name (user_id, name, deleted),
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default),
    INDEX idx_sort_order (sort_order),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏夹分类表';

-- 用户收藏表
CREATE TABLE IF NOT EXISTS tb_user_collection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_type VARCHAR(20) NOT NULL COMMENT '收藏目标类型：blog-博客（预留扩展）',
    target_id BIGINT NOT NULL COMMENT '收藏目标ID',
    folder_id BIGINT NOT NULL COMMENT '收藏分类ID',
    note TEXT COMMENT '收藏备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    UNIQUE KEY uk_user_target (user_id, target_id, target_type, deleted),
    INDEX idx_user_id (user_id),
    INDEX idx_folder_id (folder_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_create_time (create_time),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (folder_id) REFERENCES tb_collection_folder(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户收藏表';

-- 为所有现有用户创建默认收藏夹
INSERT INTO tb_collection_folder (user_id, name, is_default, sort_order)
SELECT
    id as user_id,
    '默认收藏夹' as name,
    1 as is_default,
    0 as sort_order
FROM tb_user
WHERE id NOT IN (
    SELECT DISTINCT user_id
    FROM tb_collection_folder
    WHERE deleted = 0
);