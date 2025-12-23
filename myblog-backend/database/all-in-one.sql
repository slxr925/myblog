-- ============================================
-- MyBlog 数据库完整初始化脚本
-- 包含：表结构 + 默认数据 + 示例文章
-- 创建时间: 2025-12-23
-- 使用方法: mysql -u root -p < all-in-one.sql
-- ============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myblog;

-- ============================================
-- 第一部分：表结构定义
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS tb_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
    status INT DEFAULT 0 COMMENT '状态：0-正常，1-禁用',
    role INT DEFAULT 0 COMMENT '角色：0-普通用户，1-管理员',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS tb_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(50) COMMENT '分类图标',
    sort INT DEFAULT 0 COMMENT '排序顺序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_name (name),
    INDEX idx_sort (sort),
    INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- 标签表
CREATE TABLE IF NOT EXISTS tb_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    color VARCHAR(20) DEFAULT '#1890ff' COMMENT '标签颜色',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_name (name),
    INDEX idx_deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签表';

-- 博客文章表
CREATE TABLE IF NOT EXISTS tb_blog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '文章标题',
    summary TEXT COMMENT '文章摘要',
    content LONGTEXT NOT NULL COMMENT '文章内容',
    cover_img VARCHAR(255) COMMENT '封面图片URL',
    author_id BIGINT NOT NULL COMMENT '作者ID',
    category_id BIGINT COMMENT '分类ID',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-草稿，1-已发布，2-下线',
    visibility TINYINT NOT NULL DEFAULT 1 COMMENT '可见性：0-私密，1-公开',
    is_top INT DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    publish_time DATETIME COMMENT '发布时间',
    status_changed_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '状态变更时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_author_id (author_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_is_top (is_top),
    INDEX idx_publish_time (publish_time),
    INDEX idx_create_time (create_time),
    INDEX idx_view_count (view_count),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (author_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES tb_category(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客文章表';

-- 博客标签关联表
CREATE TABLE IF NOT EXISTS tb_blog_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blog_id BIGINT NOT NULL COMMENT '博客ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_blog_id (blog_id),
    INDEX idx_tag_id (tag_id),
    UNIQUE KEY uk_blog_tag (blog_id, tag_id),
    FOREIGN KEY (blog_id) REFERENCES tb_blog(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tb_tag(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客标签关联表';

-- 评论表
CREATE TABLE IF NOT EXISTS tb_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blog_id BIGINT NOT NULL COMMENT '博客ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    parent_id BIGINT DEFAULT NULL COMMENT '父评论ID（用于回复），NULL表示顶级评论',
    reply_user_id BIGINT COMMENT '回复的用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    status INT DEFAULT 1 COMMENT '状态：0-待审核，1-已通过，2-已拒绝',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_blog_id (blog_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (blog_id) REFERENCES tb_blog(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 用户点赞表
CREATE TABLE IF NOT EXISTS tb_user_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_type VARCHAR(20) NOT NULL COMMENT '目标类型：blog-博客，comment-评论',
    target_id BIGINT NOT NULL COMMENT '目标ID',
    status TINYINT DEFAULT 1 COMMENT '状态：0-取消点赞，1-已点赞',
    create_time DATETIME NOT NULL COMMENT '创建时间',
    update_time DATETIME NOT NULL COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_user_id (user_id),
    INDEX idx_target (target_id, target_type),
    INDEX idx_status (status),
    UNIQUE KEY uk_user_target (user_id, target_id, target_type),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞表';

-- 访问日志表
CREATE TABLE IF NOT EXISTS tb_visit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    page VARCHAR(255) NOT NULL COMMENT '访问的页面',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent TEXT COMMENT '用户代理',
    user_id BIGINT COMMENT '用户ID（如果已登录）',
    visit_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_page (page),
    INDEX idx_ip_address (ip_address),
    INDEX idx_user_id (user_id),
    INDEX idx_visit_time (visit_time),
    INDEX idx_deleted (deleted),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问日志表';

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

-- 用户关注关系表
CREATE TABLE IF NOT EXISTS tb_user_follow (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关注关系ID',
    follower_id BIGINT NOT NULL COMMENT '关注者ID（粉丝）',
    followee_id BIGINT NOT NULL COMMENT '被关注者ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    UNIQUE KEY uk_follower_followee (follower_id, followee_id, deleted),
    INDEX idx_followee_id (followee_id, deleted, create_time),
    INDEX idx_follower_id (follower_id, deleted, create_time),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (follower_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES tb_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注关系表';

-- ============================================
-- 第二部分：默认数据
-- ============================================

-- 插入默认管理员用户（密码：admin123）
INSERT INTO tb_user (username, password, email, nickname, role, status) VALUES
('admin', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'admin@example.com', '管理员', 1, 0)
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- 插入默认分类
INSERT INTO tb_category (name, description, icon, sort) VALUES
('技术分享', 'Java、Spring、数据库等技术文章', 'tech', 1),
('项目实战', '实际项目开发过程和经验', 'project', 2),
('生活随笔', '日常生活感悟和随想', 'life', 3),
('学习笔记', '学习过程中的笔记和总结', 'study', 4)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 插入默认标签
INSERT INTO tb_tag (name, color) VALUES
('Java', '#f56a00'),
('Spring Boot', '#722ed1'),
('MySQL', '#1890ff'),
('Redis', '#eb2f96'),
('Vue.js', '#52c41a'),
('React', '#13c2c2'),
('Python', '#2f54eb'),
('Docker', '#fa8c16'),
('微服务', '#722ed1'),
('算法', '#fa541c'),
('前端', '#13c2c2'),
('后端', '#1890ff'),
('人工智能', '#52c41a'),
('AI Agent', '#ff6b35'),
('LangChain', '#4a90e2'),
('大语言模型', '#7b68ee'),
('企业级应用', '#32cd32')
ON DUPLICATE KEY UPDATE color = VALUES(color);

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

-- ============================================
-- 第三部分：示例文章（可选）
-- 说明：生产环境可以跳过这部分
-- ============================================

-- 插入示例博客文章
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, publish_time, status_changed_time) VALUES
('Spring Boot 3.x 新特性详解', 'Spring Boot 3.x 版本带来了很多令人兴奋的新特性，本文将详细介绍这些新特性的使用方法和最佳实践。', '# Spring Boot 3.x 新特性详解\n\nSpring Boot 3.x 是一个重要的版本升级，带来了许多令人兴奋的新特性。\n\n## 主要特性\n\n1. **基于 Jakarta EE 9+**\n2. **原生镜像支持**\n3. **性能优化**\n4. **新的配置属性**\n\n...', 1, 1, 1, 1, 1, NOW(), NOW()),
('Docker 容器化部署实践', '详细介绍如何使用 Docker 容器化部署 Spring Boot 应用，包括 Dockerfile 编写和容器编排。', '# Docker 容器化部署实践\n\n本文将详细介绍如何使用 Docker 来容器化部署 Spring Boot 应用。\n\n## Dockerfile 示例\n\n```dockerfile\nFROM openjdk:17-jdk-slim\nCOPY target/app.jar /app.jar\nENTRYPOINT [\"java\", \"-jar\", \"/app.jar\"]\n```\n\n## 部署步骤\n\n1. 构建镜像\n2. 运行容器\n3. 配置网络\n4. 数据持久化\n\n...', 1, 2, 1, 1, 0, NOW(), NOW()),
('Redis 缓存设计与优化', '分享 Redis 在项目中的缓存设计模式和性能优化技巧，包括缓存穿透、雪崩等问题的解决方案。', '# Redis 缓存设计与优化\n\nRedis 作为高性能的内存数据库，在缓存设计中有很多最佳实践。\n\n## 缓存模式\n\n1. **Cache-Aside**\n2. **Write-Through**\n3. **Write-Behind**\n\n## 常见问题\n\n- 缓存穿透\n- 缓存雪崩\n- 缓存击穿\n\n...', 1, 1, 1, 1, 0, NOW(), NOW())
ON DUPLICATE KEY UPDATE content = VALUES(content), update_time = NOW();

-- 插入博客标签关联
INSERT INTO tb_blog_tag (blog_id, tag_id) VALUES
(1, 1), (1, 2), (1, 9),
(2, 8), (2, 9),
(3, 4), (3, 9)
ON DUPLICATE KEY UPDATE create_time = NOW();

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库初始化完成！' as status;
SELECT '默认管理员账号: admin / admin123' as info;
