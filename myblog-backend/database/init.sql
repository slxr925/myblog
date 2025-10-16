-- 博客系统数据库初始化脚本
-- 创建时间: 2025-10-16

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS myblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE myblog;

-- 用户表
CREATE TABLE IF NOT EXISTS tb_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    email VARCHAR(100) COMMENT '邮箱',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
    role ENUM('USER', 'ADMIN') DEFAULT 'USER' COMMENT '用户角色',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    last_login_time DATETIME COMMENT '最后登录时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS tb_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_name (name),
    INDEX idx_sort_order (sort_order),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章分类表';

-- 标签表
CREATE TABLE IF NOT EXISTS tb_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
    color VARCHAR(7) DEFAULT '#1890ff' COMMENT '标签颜色',
    status TINYINT DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签表';

-- 博客文章表
CREATE TABLE IF NOT EXISTS tb_blog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '文章标题',
    summary TEXT COMMENT '文章摘要',
    content LONGTEXT NOT NULL COMMENT '文章内容',
    cover_img VARCHAR(255) COMMENT '封面图片URL',
    author_id BIGINT NOT NULL COMMENT '作者ID',
    author_name VARCHAR(50) COMMENT '作者姓名',
    category_id BIGINT COMMENT '分类ID',
    category_name VARCHAR(50) COMMENT '分类名称',
    status TINYINT DEFAULT 1 COMMENT '状态：0-草稿，1-已发布，2-下线',
    is_top TINYINT DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
    view_count BIGINT DEFAULT 0 COMMENT '浏览次数',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    publish_time DATETIME COMMENT '发布时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_author_id (author_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_is_top (is_top),
    INDEX idx_publish_time (publish_time),
    INDEX idx_create_time (create_time),
    INDEX idx_view_count (view_count),
    INDEX idx_like_count (like_count),
    FOREIGN KEY (author_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES tb_category(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='博客文章表';

-- 博客标签关联表
CREATE TABLE IF NOT EXISTS tb_blog_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blog_id BIGINT NOT NULL COMMENT '博客ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
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
    user_name VARCHAR(50) COMMENT '用户名',
    user_avatar VARCHAR(255) COMMENT '用户头像',
    parent_id BIGINT DEFAULT 0 COMMENT '父评论ID，0表示顶级评论',
    content TEXT NOT NULL COMMENT '评论内容',
    status TINYINT DEFAULT 1 COMMENT '状态：0-待审核，1-已通过，2-已拒绝',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    reply_count INT DEFAULT 0 COMMENT '回复数',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_blog_id (blog_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (blog_id) REFERENCES tb_blog(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES tb_comment(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- 用户点赞表
CREATE TABLE IF NOT EXISTS tb_user_like (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    target_id BIGINT NOT NULL COMMENT '目标ID（博客或评论）',
    target_type TINYINT NOT NULL COMMENT '目标类型：1-博客，2-评论',
    status TINYINT DEFAULT 1 COMMENT '状态：0-取消点赞，1-已点赞',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
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
    visit_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '访问时间',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
    INDEX idx_page (page),
    INDEX idx_ip_address (ip_address),
    INDEX idx_user_id (user_id),
    INDEX idx_visit_time (visit_time),
    FOREIGN KEY (user_id) REFERENCES tb_user(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问日志表';

-- 插入默认数据

-- 插入默认管理员用户（密码：admin123）
INSERT INTO tb_user (username, password, email, nickname, role, status) VALUES
('admin', '$2a$10$7JB720yubVSOfvVWbfXCOOxjTOQcQjmrJF1ZM4nAVccp/.rkMlDWy', 'admin@example.com', '管理员', 'ADMIN', 1)
ON DUPLICATE KEY UPDATE password = VALUES(password);

-- 插入默认分类
INSERT INTO tb_category (name, description, sort_order) VALUES
('技术分享', '分享技术相关的文章和心得', 1),
('项目实战', '记录实际项目开发过程', 2),
('生活随笔', '分享生活感悟和随笔', 3),
('学习笔记', '记录学习过程中的笔记', 4)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 插入默认标签
INSERT INTO tb_tag (name, color) VALUES
('Java', '#f89820'),
('Spring Boot', '#6db33f'),
('Docker', '#2496ed'),
('MySQL', '#4479a1'),
('Redis', '#dc382d'),
('Vue.js', '#4fc08d'),
('React', '#61dafb'),
('微服务', '#8a2be2'),
('后端', '#ff6b6b'),
('前端', '#4ecdc4')
ON DUPLICATE KEY UPDATE color = VALUES(color);

-- 插入示例博客文章
INSERT INTO tb_blog (title, summary, content, author_id, author_name, category_id, category_name, status, is_top, publish_time) VALUES
('Spring Boot 3.x 新特性详解', 'Spring Boot 3.x 版本带来了很多令人兴奋的新特性，本文将详细介绍这些新特性的使用方法和最佳实践。', '# Spring Boot 3.x 新特性详解\n\nSpring Boot 3.x 是一个重要的版本升级，带来了许多令人兴奋的新特性。\n\n## 主要特性\n\n1. **基于 Jakarta EE 9+**\n2. **原生镜像支持**\n3. **性能优化**\n4. **新的配置属性**\n\n...', 1, '管理员', 1, '技术分享', 1, 1, NOW()),
('Docker 容器化部署实践', '详细介绍如何使用 Docker 容器化部署 Spring Boot 应用，包括 Dockerfile 编写和容器编排。', '# Docker 容器化部署实践\n\n本文将详细介绍如何使用 Docker 来容器化部署 Spring Boot 应用。\n\n## Dockerfile 示例\n\n```dockerfile\nFROM openjdk:17-jdk-slim\nCOPY target/app.jar /app.jar\nENTRYPOINT ["java", "-jar", "/app.jar"]\n```\n\n## 部署步骤\n\n1. 构建镜像\n2. 运行容器\n3. 配置网络\n4. 数据持久化\n\n...', 1, '管理员', 2, '项目实战', 1, 0, NOW()),
('Redis 缓存设计与优化', '分享 Redis 在项目中的缓存设计模式和性能优化技巧，包括缓存穿透、雪崩等问题的解决方案。', '# Redis 缓存设计与优化\n\nRedis 作为高性能的内存数据库，在缓存设计中有很多最佳实践。\n\n## 缓存模式\n\n1. **Cache-Aside**\n2. **Write-Through**\n3. **Write-Behind**\n\n## 常见问题\n\n- 缓存穿透\n- 缓存雪崩\n- 缓存击穿\n\n...', 1, '管理员', 1, '技术分享', 1, 0, NOW())
ON DUPLICATE KEY UPDATE content = VALUES(content), update_time = NOW();

-- 插入博客标签关联
INSERT INTO tb_blog_tag (blog_id, tag_id) VALUES
(1, 1), (1, 2), (1, 9),
(2, 3), (2, 9),
(3, 5), (3, 9)
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 创建数据库用户并授权（生产环境使用）
-- CREATE USER 'myblog_user'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON myblog.* TO 'myblog_user'@'localhost';
-- FLUSH PRIVILEGES;

-- 设置数据库字符集
ALTER DATABASE myblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;