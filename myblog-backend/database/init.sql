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

-- 用户浏览记录表
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

-- V1.0.1 Notification Tables

-- 通知系统数据库表
-- 执行前请确保已选择正确的数据库

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

-- Temp columns for compatibility
ALTER TABLE tb_blog ADD COLUMN like_count INT DEFAULT 0;
ALTER TABLE tb_blog ADD COLUMN comment_count INT DEFAULT 0;

-- Seed Data

-- 新增实用开发踩坑和工具体验文章
-- 执行前请备份数据库

-- 先添加一些新标签
INSERT INTO tb_tag (name, color, deleted, create_time, update_time) VALUES
('踩坑记录', '#ff4d4f', 0, NOW(), NOW()),
('工具推荐', '#52c41a', 0, NOW(), NOW()),
('效率提升', '#1890ff', 0, NOW(), NOW()),
('调试技巧', '#fa8c16', 0, NOW(), NOW()),
('配置问题', '#eb2f96', 0, NOW(), NOW());

-- 文章1: MyBatis踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('MyBatis 一对多查询的 LIMIT 陷阱：我是怎么被坑了一天的', 
'记录一次 MyBatis 使用 LEFT JOIN + collection 映射时遇到的 LIMIT 失效问题，以及最终的解决方案。',
'## 问题背景

上周在开发博客首页时，遇到了一个诡异的问题：明明请求 6 篇文章，接口却返回了 4 篇。

```java
// 期望返回 6 篇
List<BlogDetailVO> blogs = blogMapper.selectLatestBlogsWithTags(6);
// 实际只返回 4 篇
```

## 问题排查

### 第一反应：是不是缓存问题？

清空 Redis 缓存后，问题依旧。排除缓存。

### 第二反应：看看 SQL

打开 MyBatis 日志，发现执行的 SQL 是这样的：

```sql
SELECT DISTINCT b.*, t.id as tag_id, t.name as tag_name
FROM tb_blog b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
WHERE b.deleted = 0 AND b.status = 1
ORDER BY b.publish_time DESC
LIMIT 6
```

SQL 看起来没问题啊？

### 真相大白

仔细看返回的行数：`Total: 15`。

原来一篇有 4 个标签的文章会产生 4 行数据！LIMIT 6 作用在 JOIN 后的结果上，所以：
- 第一篇文章（4个标签）= 4 行
- 第二篇文章（2个标签）= 2 行  
- 一共 6 行，但只有 2 篇文章

MyBatis 的 `collection` 映射会把相同 ID 的行合并成一个对象，所以最终只返回了部分文章。

## 解决方案

使用**子查询**，先限制文章数量，再 JOIN 标签：

```sql
SELECT b.*, t.id as tag_id, t.name as tag_name
FROM (
    SELECT blog.* 
    FROM tb_blog blog
    WHERE blog.deleted = 0 AND blog.status = 1
    ORDER BY blog.publish_time DESC
    LIMIT 6  -- 在子查询中先限制文章数量
) b
LEFT JOIN tb_blog_tag bt ON b.id = bt.blog_id
LEFT JOIN tb_tag t ON bt.tag_id = t.id
ORDER BY b.publish_time DESC
```

## 经验总结

1. **LIMIT + JOIN + collection 是个坑**：LIMIT 作用于 JOIN 后的行数，不是最终对象数
2. **子查询救命**：先在子查询中筛选主表，再关联从表
3. **开启 MyBatis 日志**：生产环境关掉，开发环境一定要开，能省很多排查时间

希望这篇踩坑记录能帮到遇到同样问题的你！', 
1, 4, 1, 1, 0, 342, 28, 5, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW(), 0);

-- 文章2: Docker 网络踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Docker 容器访问宿主机服务的三种方式（附踩坑记录）', 
'容器内访问宿主机的 MySQL、Redis 总是连不上？这篇文章帮你彻底搞懂 Docker 网络。',
'## 场景

部署博客系统时，MySQL 和 Redis 装在宿主机上，Spring Boot 应用跑在 Docker 容器里。

配置文件写的是 `localhost:3306`，结果容器启动就报错：

```
Connection refused: localhost:3306
```

## 为什么 localhost 不行？

容器有自己独立的网络命名空间，容器里的 `localhost` 指向的是容器自己，不是宿主机。

## 三种解决方案

### 方案一：使用 host.docker.internal（推荐）

Docker Desktop（Mac/Windows）自带这个特殊域名：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://host.docker.internal:3306/myblog
```

Linux 下需要手动添加：

```yaml
# docker-compose.yml
services:
  backend:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### 方案二：使用宿主机 IP

获取 Docker 网桥的网关 IP（通常是 `172.17.0.1`）：

```bash
docker network inspect bridge | grep Gateway
# "Gateway": "172.17.0.1"
```

```yaml
spring:
  datasource:
    url: jdbc:mysql://172.17.0.1:3306/myblog
```

### 方案三：使用 host 网络模式

最简单粗暴，容器直接共享宿主机网络：

```yaml
services:
  backend:
    network_mode: host
```

缺点：失去网络隔离，端口冲突风险。

## 踩坑记录

### 坑1：MySQL 绑定了 127.0.0.1

即使用了正确的 IP，还是连不上？检查 MySQL 配置：

```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
bind-address = 0.0.0.0  # 不要用 127.0.0.1
```

### 坑2：防火墙拦截

```bash
# 检查端口是否开放
sudo ufw allow 3306
```

### 坑3：Redis 保护模式

```conf
# redis.conf
protected-mode no
bind 0.0.0.0
```

## 我的最终配置

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      MYSQL_HOST: 172.17.0.1
      MYSQL_PORT: 13306
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

这个问题卡了我半天，希望能帮到你少走弯路！', 
1, 2, 1, 1, 0, 567, 45, 12, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW(), 0);

-- 文章3: IDEA 效率插件
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('2024 年我离不开的 10 个 IDEA 插件（附配置技巧）', 
'用了 5 年 IDEA，这些插件真的能大幅提升开发效率。不是广告，纯个人体验分享。',
'## 为什么写这篇

用 IDEA 五年了，插件装了一堆，但真正每天都用的其实就这几个。今天整理分享一下。

## 必装插件

### 1. GitHub Copilot ⭐⭐⭐⭐⭐

现在写代码真的离不开它了。不只是自动补全，它能理解上下文：

- 写注释，它帮你生成代码
- 写方法名，它猜你要干什么
- 写测试，它知道你要测哪个方法

**Tips**: 按 `Tab` 接受建议，`Alt+]` 看下一个建议。

### 2. Key Promoter X ⭐⭐⭐⭐⭐

每次用鼠标点菜单，它会弹窗告诉你快捷键。用了一个月，快捷键全记住了。

### 3. Rainbow Brackets ⭐⭐⭐⭐

括号配对用不同颜色，嵌套多的时候特别有用。

```java
if (a && (b || (c && d))) {  // 每层括号不同颜色
    // ...
}
```

### 4. MyBatisX ⭐⭐⭐⭐⭐

做 Java 后端必装：
- Mapper 接口和 XML 一键跳转
- 自动生成 CRUD 代码
- SQL 语法检查

### 5. GitToolBox ⭐⭐⭐⭐

在编辑器里直接看每行代码的 Git Blame，谁写的一目了然（主要用来甩锅）。

## 效率插件

### 6. String Manipulation

字符串各种转换：驼峰、下划线、大小写、排序、去重...

快捷键 `Alt+M` 打开菜单。

### 7. GenerateAllSetter

`new` 一个对象后，`Alt+Enter` 一键生成所有 setter 调用。写单元测试救命。

### 8. .ignore

管理 `.gitignore` 文件，提供各种模板。

## 外观插件

### 9. One Dark Theme

暗色主题，护眼。配合 JetBrains Mono 字体使用。

### 10. Atom Material Icons

文件图标美化，不同文件类型一眼区分。

## 我的配置技巧

### 关闭不用的插件

`Settings > Plugins > Installed`，禁用不常用的，启动速度快很多。

### 增加内存

```
# idea64.vmoptions
-Xms1024m
-Xmx4096m
```

### 自动导入优化

```
Settings > Editor > General > Auto Import
- Add unambiguous imports on the fly ✓
- Optimize imports on the fly ✓
```

这些插件帮我每天至少省 30 分钟，希望对你也有帮助！', 
1, 1, 1, 1, 0, 892, 76, 23, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW(), NOW(), 0);

-- 文章4: 前端调试技巧
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Chrome DevTools 调试技巧：这些功能你可能从没用过', 
'用了多年 Chrome 开发者工具，最近才发现这些隐藏功能。整理分享，建议收藏。',
'## 前言

Chrome DevTools 打开方式人人都会（F12），但很多强大功能藏得很深。

## Console 进阶

### 1. console.table()

展示数组/对象，比 `console.log` 清晰 100 倍：

```javascript
const users = [
  { name: "张三", age: 25 },
  { name: "李四", age: 30 }
];
console.table(users);
```

### 2. console.time() / console.timeEnd()

精确测量代码执行时间：

```javascript
console.time("fetch");
await fetch("/api/data");
console.timeEnd("fetch"); // fetch: 234.56ms
```

### 3. $0 快速引用

在 Elements 面板选中元素后，Console 里输入 `$0` 就能引用它：

```javascript
$0.style.border = "2px solid red"; // 给选中元素加红框
```

## Network 面板

### 4. 按住 Shift 查看依赖

按住 Shift 悬停在请求上，绿色是依赖它的请求，红色是它依赖的请求。

### 5. 模拟弱网环境

`Network > Throttling` 下拉菜单，选择 Slow 3G 测试弱网表现。

### 6. 复制为 cURL

右键请求 > Copy > Copy as cURL，直接在终端重放请求。

## Sources 面板

### 7. 条件断点

右键行号 > Add conditional breakpoint：

```javascript
// 只在 userId === 123 时断住
userId === 123
```

### 8. 日志断点（Logpoint）

不想打 console.log 又想看变量值？右键 > Add logpoint：

```
用户ID: {userId}, 状态: {status}
```

## Elements 面板

### 9. 强制元素状态

右键元素 > Force state，可以让元素保持 `:hover`、`:focus` 等状态，调试样式超方便。

### 10. 截图

`Cmd+Shift+P` 打开命令面板，输入 `screenshot`：
- Capture full size screenshot：整个页面
- Capture node screenshot：选中的元素

## 我的调试流程

1. **打开 Network 面板**，勾选 Preserve log
2. **复现问题**，观察请求
3. **看 Console 报错**
4. **打断点调试**

这些技巧帮我 debug 效率翻倍，你有什么独门技巧？评论区分享一下！', 
1, 1, 1, 1, 0, 734, 58, 15, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW(), NOW(), 0);

-- 文章5: Git 踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Git 操作失误怎么办？这几个命令救过我无数次', 
'手滑 commit 了敏感信息？force push 覆盖了同事代码？别慌，还有救。',
'## 场景一：commit 了不该 commit 的文件

把 `.env` 里的密码 commit 了？

### 救命命令

```bash
# 还没 push 的话
git reset HEAD~1  # 撤销最后一次 commit，保留修改
git reset --soft HEAD~1  # 同上

# 已经 push 了
git revert HEAD  # 创建一个新 commit 来撤销
```

### 完全删除历史中的敏感文件

```bash
# 用 git-filter-repo（推荐）
pip install git-filter-repo
git filter-repo --path .env --invert-paths

# 或者 BFG
bfg --delete-files .env
git push --force
```

## 场景二：改错分支了

在 main 上改了代码才发现应该在 feature 分支...

```bash
# 1. 暂存当前修改
git stash

# 2. 切换到正确分支
git checkout feature

# 3. 恢复修改
git stash pop
```

## 场景三：commit message 写错了

```bash
# 修改最后一次 commit message
git commit --amend -m "新的提交信息"

# 已经 push 了就要 force push
git push --force-with-lease
```

## 场景四：找回删除的分支

删了分支才发现还有用？

```bash
# 查看所有操作历史
git reflog

# 找到删除前的 commit hash，恢复分支
git checkout -b 分支名 abc1234
```

## 场景五：合并冲突太多想放弃

```bash
# 放弃 merge
git merge --abort

# 放弃 rebase
git rebase --abort
```

## 场景六：想看某个文件的历史版本

```bash
# 查看文件的历史
git log --oneline -- path/to/file

# 恢复到某个版本
git checkout abc1234 -- path/to/file
```

## 保命配置

```bash
# 防止误 push 到 main
git config --global branch.main.pushRemote no_push

# force push 前先检查远程有没有其他人的提交
git config --global push.default current
git push --force-with-lease  # 用这个代替 --force
```

## 总结

| 场景 | 命令 |
|------|------|
| 撤销 commit（未 push） | `git reset HEAD~1` |
| 撤销 commit（已 push） | `git revert HEAD` |
| 修改 commit message | `git commit --amend` |
| 找回删除的分支 | `git reflog` |
| 放弃 merge | `git merge --abort` |

这些命令记不住没关系，收藏这篇文章就行！', 
1, 4, 1, 1, 0, 456, 39, 8, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW(), NOW(), 0);

-- 文章6: Spring Boot 配置踩坑
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time, deleted) VALUES
('Spring Boot 配置加载顺序踩坑：为什么我的配置不生效？', 
'application.yml 改了配置不生效？环境变量覆盖了配置文件？这篇帮你彻底搞懂配置优先级。',
'## 问题

在 `application.yml` 里配置了数据库地址，但启动后总是连接到错误的地址。

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myblog
```

结果连接的是 `172.17.0.1:3306`，百思不得其解。

## 真相

Spring Boot 配置有**优先级**，高优先级会覆盖低优先级。

## 配置加载顺序（从高到低）

1. **命令行参数**：`--spring.datasource.url=xxx`
2. **SPRING_APPLICATION_JSON**：环境变量中的 JSON
3. **JVM 系统属性**：`-Dspring.datasource.url=xxx`
4. **环境变量**：`SPRING_DATASOURCE_URL=xxx`
5. **application-{profile}.yml**：如 `application-prod.yml`
6. **application.yml**

我的问题是 `docker-compose.yml` 里设置了环境变量：

```yaml
environment:
  MYSQL_HOST: 172.17.0.1
```

而我的配置用了占位符：

```yaml
spring:
  datasource:
    url: jdbc:mysql://${MYSQL_HOST:localhost}:3306/myblog
```

环境变量优先级高于 yml 默认值，所以 `172.17.0.1` 覆盖了 `localhost`。

## 环境变量命名规则

Spring Boot 会自动转换环境变量名：

| 配置 | 环境变量 |
|------|---------|
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` |
| `server.port` | `SERVER_PORT` |
| `my-app.feature.enabled` | `MY_APP_FEATURE_ENABLED` |

规则：小写改大写，`.` 和 `-` 改 `_`

## 调试技巧

### 查看所有生效的配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: env,configprops
```

访问 `/actuator/env` 查看配置来源。

### 打印配置值

```java
@Value("${spring.datasource.url}")
private String datasourceUrl;

@PostConstruct
public void printConfig() {
    log.info("数据库地址: {}", datasourceUrl);
}
```

## 最佳实践

### 1. 多环境配置

```
application.yml           # 公共配置
application-dev.yml       # 开发环境
application-prod.yml      # 生产环境
```

激活方式：`--spring.profiles.active=prod`

### 2. 敏感信息用环境变量

```yaml
spring:
  datasource:
    password: ${MYSQL_PASSWORD}  # 不要写死在配置文件里
```

### 3. 配置分组

```yaml
# 用 --- 分隔多个配置
spring:
  config:
    activate:
      on-profile: dev
server:
  port: 8080
---
spring:
  config:
    activate:
      on-profile: prod
server:
  port: 80
```

希望这篇能帮你避开 Spring Boot 配置的坑！', 
1, 1, 1, 1, 0, 623, 52, 11, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW(), NOW(), 0);

-- 获取新增标签的ID
SET @tag_pit = (SELECT id FROM tb_tag WHERE name = '踩坑记录' LIMIT 1);
SET @tag_tool = (SELECT id FROM tb_tag WHERE name = '工具推荐' LIMIT 1);
SET @tag_eff = (SELECT id FROM tb_tag WHERE name = '效率提升' LIMIT 1);
SET @tag_debug = (SELECT id FROM tb_tag WHERE name = '调试技巧' LIMIT 1);
SET @tag_config = (SELECT id FROM tb_tag WHERE name = '配置问题' LIMIT 1);

-- 获取新文章的ID
SET @blog1 = (SELECT id FROM tb_blog WHERE title LIKE '%MyBatis%LIMIT%' LIMIT 1);
SET @blog2 = (SELECT id FROM tb_blog WHERE title LIKE '%Docker%容器访问宿主机%' LIMIT 1);
SET @blog3 = (SELECT id FROM tb_blog WHERE title LIKE '%IDEA 插件%' LIMIT 1);
SET @blog4 = (SELECT id FROM tb_blog WHERE title LIKE '%Chrome DevTools%' LIMIT 1);
SET @blog5 = (SELECT id FROM tb_blog WHERE title LIKE '%Git 操作失误%' LIMIT 1);
SET @blog6 = (SELECT id FROM tb_blog WHERE title LIKE '%Spring Boot 配置加载%' LIMIT 1);

-- 关联标签
INSERT INTO tb_blog_tag (blog_id, tag_id) VALUES
(@blog1, 3),     -- MySQL
(@blog1, @tag_pit),
(@blog1, 12),    -- 后端

(@blog2, 8),     -- Docker
(@blog2, @tag_pit),
(@blog2, @tag_config),

(@blog3, @tag_tool),
(@blog3, @tag_eff),
(@blog3, 1),     -- Java

(@blog4, 11),    -- 前端
(@blog4, @tag_debug),
(@blog4, @tag_eff),

(@blog5, @tag_pit),
(@blog5, @tag_debug),

(@blog6, 2),     -- Spring Boot
(@blog6, @tag_pit),
(@blog6, @tag_config);

SELECT '文章插入完成！' as status;
-- 博客文章种子数据
-- 为本地开发和生产环境生成丰富的测试数据
-- 创建时间: 2025-12-13

USE myblog;

-- ============================================
-- 插入新的高质量技术博客文章
-- ============================================

-- 文章: AI Agent 入门
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('从零构建 AI Agent：LangChain 实战指南', 
'深入理解 AI Agent 的核心概念，通过 LangChain 框架实现一个具备工具调用能力的智能助手。本文涵盖 Agent 架构设计、Prompt Engineering 和实战案例。',
'# 从零构建 AI Agent：LangChain 实战指南

## 前言

随着大语言模型（LLM）的快速发展，AI Agent 已成为当下最热门的技术趋势之一。本文将带你深入理解 Agent 的核心概念，并通过 LangChain 框架构建一个功能完整的智能助手。

## 什么是 AI Agent？

AI Agent 是一个能够**感知环境、做出决策、执行动作**的智能系统。与传统的 LLM 应用不同，Agent 具备以下特点：

1. **自主规划** - 能够分解复杂任务为多个步骤
2. **工具调用** - 可以使用外部工具扩展能力
3. **记忆机制** - 保持上下文连贯性
4. **反思能力** - 能够评估和修正自己的行为

## 核心架构

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory

# 定义工具
tools = [
    Tool(
        name="Search",
        func=search_tool,
        description="用于搜索互联网信息"
    ),
    Tool(
        name="Calculator",
        func=calculator_tool,
        description="用于数学计算"
    )
]

# 初始化 Agent
agent = initialize_agent(
    tools=tools,
    llm=OpenAI(temperature=0),
    agent="zero-shot-react-description",
    memory=ConversationBufferMemory(),
    verbose=True
)
```

## ReAct 框架

ReAct (Reasoning + Acting) 是目前最流行的 Agent 框架：

```
思考 (Thought) → 行动 (Action) → 观察 (Observation) → 循环
```

这种模式让 Agent 能够在执行前进行推理，根据观察结果调整策略，逐步逼近目标。

## 最佳实践

### 1. Prompt Engineering

好的提示词是 Agent 成功的关键。需要明确定义角色、任务目标和可用工具。

### 2. 错误处理

实现重试机制和降级处理，确保 Agent 的稳定性。

### 3. 成本控制

- 设置最大迭代次数
- 使用缓存减少重复调用
- 选择合适的模型

## 总结

AI Agent 代表了 AI 应用的新范式。通过 LangChain 等框架，我们可以快速构建具备推理和行动能力的智能系统。

---

*如果你对 AI Agent 有任何问题，欢迎在评论区讨论！*',
1, 1, 1, 1, 1, 1234, 89, 23,
TIMESTAMPADD(HOUR, -48, NOW()), NOW());

-- 文章: React 性能优化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('React 19 性能优化完全指南', 
'深入探讨 React 19 的性能优化技巧，包括 Server Components、Suspense、并发渲染等新特性的最佳实践。',
'# React 19 性能优化完全指南

## 引言

React 19 带来了革命性的性能改进。本文将系统地介绍如何利用这些新特性构建高性能的 React 应用。

## Server Components

React Server Components (RSC) 是 React 19 最重要的特性之一：

```tsx
// app/page.tsx - Server Component
async function BlogList() {
  // 直接在服务端获取数据
  const posts = await db.posts.findMany()
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### 优势

1. **零 Bundle Size** - 服务端组件不会打包到客户端
2. **直接数据访问** - 无需 API 层
3. **更好的 SEO** - 完整的 HTML 渲染

## 并发渲染

### useTransition

```tsx
function SearchResults() {
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()
  
  const handleChange = (e) => {
    setQuery(e.target.value)
    startTransition(() => {
      fetchResults(e.target.value)
    })
  }
  
  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </>
  )
}
```

## 记忆化策略

### React.memo

```tsx
const ExpensiveComponent = React.memo(({ data }) => {
  return <ExpensiveVisualization data={data} />
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})
```

## 总结

React 19 的性能优化需要综合运用多种技术：

| 技术 | 适用场景 |
|------|---------|
| Server Components | 静态内容、数据获取 |
| useTransition | 非紧急的 UI 更新 |
| Suspense | 异步数据加载 |
| React.memo | 避免不必要的重渲染 |

希望这些技巧能帮助你构建更快的 React 应用！',
1, 1, 1, 1, 0, 856, 56, 12,
TIMESTAMPADD(HOUR, -72, NOW()), NOW());

-- 文章: Java 虚拟线程
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('Java 21 虚拟线程实战：告别传统线程池', 
'Java 21 正式引入虚拟线程（Virtual Threads），彻底改变了 Java 并发编程模式。本文通过实际案例对比传统线程池和虚拟线程的性能差异。',
'# Java 21 虚拟线程实战：告别传统线程池

## 什么是虚拟线程？

虚拟线程是 Java 21 引入的轻量级线程实现，由 JVM 管理而非操作系统。一个 JVM 可以轻松创建数百万个虚拟线程！

## 传统线程 vs 虚拟线程

### 传统方式

```java
ExecutorService executor = Executors.newFixedThreadPool(200);

for (int i = 0; i < 10000; i++) {
    final int taskId = i;
    executor.submit(() -> {
        Thread.sleep(1000);
        return "Task " + taskId;
    });
}
```

**问题**：线程池大小有限，大量任务需要排队等待。

### 虚拟线程方式

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10000; i++) {
        final int taskId = i;
        executor.submit(() -> {
            Thread.sleep(1000);
            return "Task " + taskId;
        });
    }
}
```

**优势**：每个任务一个虚拟线程，无需排队！

## 性能对比

| 指标 | 传统线程池 (200线程) | 虚拟线程 |
|-----|---------------------|---------|
| 10000 任务完成时间 | ~50秒 | ~1秒 |
| 内存占用 | ~200MB | ~50MB |
| 线程创建开销 | 高 | 极低 |

## Spring Boot 集成

```yaml
spring:
  threads:
    virtual:
      enabled: true
```

就这么简单！Spring Boot 3.2+ 会自动使用虚拟线程处理请求。

## 总结

虚拟线程是 Java 并发编程的重大突破：

1. **超高并发** - 轻松处理百万级并发
2. **简化代码** - 告别复杂的异步回调
3. **降低资源** - 更少的内存占用
4. **无缝集成** - 与现有代码完全兼容

赶紧升级到 Java 21，体验虚拟线程的魅力吧！',
1, 1, 1, 1, 0, 723, 42, 8,
TIMESTAMPADD(HOUR, -96, NOW()), NOW());

-- 文章: MySQL 索引优化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('MySQL 索引优化实战：从慢查询到毫秒级响应', 
'通过真实案例讲解 MySQL 索引设计原则、EXPLAIN 分析技巧和常见优化策略，帮助你从根本上解决慢查询问题。',
'# MySQL 索引优化实战：从慢查询到毫秒级响应

## 问题背景

最近线上系统出现了严重的慢查询问题，一个简单的列表查询竟然需要 5 秒！

## 案例分析

### 问题 SQL

```sql
SELECT * FROM orders 
WHERE user_id = 123 
  AND status = 1 
  AND create_time > "2024-01-01"
ORDER BY create_time DESC
LIMIT 20;
```

执行时间：5.2秒

### EXPLAIN 分析结果

**全表扫描**！没有使用任何索引。

## 索引设计原则

### 1. 最左前缀原则

```sql
CREATE INDEX idx_user_status_time 
ON orders(user_id, status, create_time);
```

### 2. 选择性原则

高选择性的列应该放在索引前面。

### 3. 覆盖索引

使用覆盖索引时，Extra 显示 "Using index"，无需回表！

## 优化效果

执行时间：**12ms**

## 常见索引陷阱

1. **函数导致索引失效** - 避免在索引列上使用函数
2. **隐式类型转换** - 确保数据类型一致
3. **OR 条件优化** - 考虑使用 UNION 替代

## 总结

| 优化策略 | 效果 |
|---------|------|
| 联合索引 | 避免多个单列索引 |
| 覆盖索引 | 避免回表查询 |
| 避免函数 | 保持索引有效 |

记住：**不是索引越多越好**，每个索引都有维护成本！',
1, 4, 1, 1, 0, 1567, 98, 31,
TIMESTAMPADD(HOUR, -120, NOW()), NOW());

-- 文章: 职业发展
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('程序员如何突破职业瓶颈：技术与管理双线发展', 
'分享从初级开发者到技术负责人的成长经历，探讨技术深度与管理宽度的平衡之道。',
'# 程序员如何突破职业瓶颈：技术与管理双线发展

## 引言

工作五年了，你是否感觉：
- 技术增长变慢？
- 晋升遇到天花板？
- 不知道该走技术还是管理？

今天分享一些个人的成长心得。

## 职业发展阶段

### 第一阶段：技术积累期 (1-3年)

**核心任务**：打好技术基础

- 熟练掌握主流技术栈
- 培养良好的编码习惯
- 学会阅读源码和文档

### 第二阶段：技术成长期 (3-5年)

**核心任务**：建立技术体系

- 掌握架构设计能力
- 理解业务全局
- 带新人、做分享

### 第三阶段：方向选择期 (5年+)

#### 路线A：技术专家

高级工程师 → 技术专家 → 架构师 → 首席架构师

#### 路线B：技术管理

技术骨干 → 技术组长 → 技术经理 → 技术总监

## 核心建议

### 1. 保持技术敏感度

无论走哪条路，都不能放弃技术：

- 每周：阅读技术文章
- 每月：尝试新技术/工具
- 每季度：完成一个小项目

### 2. 培养软技能

- **沟通能力**：清晰表达技术方案
- **写作能力**：文档、博客、周报
- **演讲能力**：技术分享、汇报

### 3. 构建影响力

- 写技术博客
- 参与开源项目
- 技术社区活跃

## 结语

职业发展没有标准答案。无论选择哪条路，都需要：

- 明确目标
- 持续学习
- 勇于挑战
- 保持开放

希望每个程序员都能找到适合自己的发展道路！

---

*你目前处于哪个阶段？有什么困惑？欢迎留言讨论！*',
1, 3, 1, 1, 0, 2341, 156, 45,
TIMESTAMPADD(HOUR, -144, NOW()), NOW());

-- 文章: 微服务架构
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('微服务架构避坑指南：从单体到分布式的演进之路', 
'结合实际项目经验，分享微服务架构设计中的常见问题和解决方案，包括服务拆分、数据一致性、调用链路追踪等核心话题。',
'# 微服务架构避坑指南：从单体到分布式的演进之路

## 前言

微服务架构是当下流行的架构模式，但它并不是银弹。本文分享一些实战中踩过的坑。

## 什么时候需要微服务？

### 单体架构的痛点

- 代码量巨大，编译部署慢
- 团队协作困难，代码冲突频繁
- 技术栈绑定，无法灵活选型
- 局部故障影响整体

### 微服务不是必选项

如果你的团队人数少于 10 人、业务复杂度较低，**单体架构可能是更好的选择**。

## 服务拆分原则

### 1. 业务边界清晰

根据领域驱动设计（DDD）的界限上下文划分。

### 2. 数据独立性

每个服务拥有自己的数据库，禁止直接访问其他服务的数据库。

### 3. 服务粒度适中

**经验法则**：一个服务由 2-3 人维护是合适的大小。

## 常见问题及解决方案

### 问题1：分布式事务

使用 Saga 模式或最终一致性方案。

### 问题2：服务发现

使用 Nacos 或 Consul 实现服务注册与发现。

### 问题3：调用链路追踪

使用 SkyWalking 或 Jaeger。

## 技术选型建议

| 组件 | 推荐方案 |
|-----|---------|
| 服务框架 | Spring Cloud Alibaba |
| 注册中心 | Nacos |
| 网关 | Spring Cloud Gateway |
| 熔断限流 | Sentinel |

## 总结

微服务是一把双刃剑：

**优点**：独立开发/部署/扩展、技术栈灵活、故障隔离

**缺点**：分布式系统复杂性、运维成本高、调试困难

**建议**：从单体开始，逐步演进。

---

*你的团队在微服务实践中遇到了哪些问题？欢迎分享交流！*',
1, 2, 1, 1, 0, 689, 34, 9,
TIMESTAMPADD(HOUR, -168, NOW()), NOW());

-- 文章: 前端工程化
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, visibility, is_top, view_count, like_count, comment_count, publish_time, status_changed_time) VALUES
('2024 前端工程化最佳实践：从 Vite 到 Monorepo', 
'深入探讨现代前端工程化实践，包括 Vite 配置优化、Monorepo 管理、CI/CD 流程和代码规范。',
'# 2024 前端工程化最佳实践：从 Vite 到 Monorepo

## 为什么需要工程化？

现代前端项目复杂度日益增加，工程化能帮助我们：**提高效率、保证质量、降低成本**。

## 构建工具：Vite

### 为什么选择 Vite？

| 对比项 | Webpack | Vite |
|-------|---------|------|
| 开发启动 | 分钟级 | 秒级 |
| HMR 速度 | 秒级 | 毫秒级 |
| 配置复杂度 | 高 | 低 |

### Vite 优化配置

```typescript
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"]
        }
      }
    }
  }
})
```

## Monorepo 实践

### 为什么用 Monorepo？

- 代码复用更方便
- 统一版本管理
- 原子化提交

### 工具选择：pnpm + Turborepo

```
my-monorepo/
├── apps/
│   ├── web/
│   └── admin/
├── packages/
│   ├── ui/
│   └── utils/
└── turbo.json
```

## 代码规范

### ESLint + Prettier

统一代码风格，避免低级错误。

### Git Hooks (Husky + lint-staged)

提交前自动检查和格式化代码。

## 总结

2024 年前端工程化的核心要点：

| 领域 | 推荐方案 |
|-----|---------|
| 构建工具 | Vite |
| 包管理 | pnpm |
| Monorepo | Turborepo |
| 代码规范 | ESLint + Prettier |
| 测试框架 | Vitest |
| CI/CD | GitHub Actions |

工程化是一个持续优化的过程，选择适合团队的方案最重要！',
1, 1, 1, 1, 0, 534, 28, 6,
TIMESTAMPADD(HOUR, -192, NOW()), NOW());

-- ============================================
-- 更新博客标签关联
-- ============================================

-- AI Agent 文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '从零构建 AI Agent：LangChain 实战指南' 
AND t.name IN ('人工智能', 'AI Agent', 'LangChain', 'Python')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- React 性能优化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'React 19 性能优化完全指南' 
AND t.name IN ('React', '前端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- Java 虚拟线程文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'Java 21 虚拟线程实战：告别传统线程池' 
AND t.name IN ('Java', '后端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- MySQL 索引优化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = 'MySQL 索引优化实战：从慢查询到毫秒级响应' 
AND t.name IN ('MySQL', '后端')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 微服务架构文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '微服务架构避坑指南：从单体到分布式的演进之路' 
AND t.name IN ('微服务', 'Java', 'Spring Boot', 'Docker')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 前端工程化文章标签
INSERT INTO tb_blog_tag (blog_id, tag_id) 
SELECT b.id, t.id FROM tb_blog b, tb_tag t 
WHERE b.title = '2024 前端工程化最佳实践：从 Vite 到 Monorepo' 
AND t.name IN ('前端', 'React')
ON DUPLICATE KEY UPDATE create_time = NOW();

-- 脚本执行完成提示
SELECT CONCAT('成功插入 ', COUNT(*), ' 篇新文章') AS result 
FROM tb_blog WHERE title IN (
    '从零构建 AI Agent：LangChain 实战指南',
    'React 19 性能优化完全指南',
    'Java 21 虚拟线程实战：告别传统线程池',
    'MySQL 索引优化实战：从慢查询到毫秒级响应',
    '程序员如何突破职业瓶颈：技术与管理双线发展',
    '微服务架构避坑指南：从单体到分布式的演进之路',
    '2024 前端工程化最佳实践：从 Vite 到 Monorepo'
);


-- Remove temp columns
ALTER TABLE tb_blog DROP COLUMN like_count;
ALTER TABLE tb_blog DROP COLUMN comment_count;
