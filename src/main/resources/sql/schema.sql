-- 创建用户表
CREATE TABLE IF NOT EXISTS tb_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像地址',
    bio TEXT COMMENT '个人简介',
    status INT DEFAULT 0 COMMENT '用户状态：0-正常，1-禁用',
    role INT DEFAULT 0 COMMENT '用户角色：0-普通用户，1-管理员',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除'
) COMMENT '用户表';

-- 创建分类表
CREATE TABLE IF NOT EXISTS tb_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '分类ID',
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description TEXT COMMENT '分类描述',
    icon VARCHAR(50) COMMENT '分类图标',
    sort INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除'
) COMMENT '分类表';

-- 创建标签表
CREATE TABLE IF NOT EXISTS tb_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签ID',
    name VARCHAR(50) NOT NULL COMMENT '标签名称',
    color VARCHAR(20) COMMENT '标签颜色',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除'
) COMMENT '标签表';

-- 创建博客表
CREATE TABLE IF NOT EXISTS tb_blog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '博客ID',
    title VARCHAR(255) NOT NULL COMMENT '文章标题',
    summary TEXT COMMENT '文章摘要',
    content LONGTEXT NOT NULL COMMENT '文章内容',
    cover_img VARCHAR(255) COMMENT '文章封面图片',
    author_id BIGINT NOT NULL COMMENT '作者ID',
    category_id BIGINT COMMENT '分类ID',
    status INT DEFAULT 0 COMMENT '文章状态：0-草稿，1-已发布，2-已下线',
    is_top INT DEFAULT 0 COMMENT '是否置顶：0-否，1-是',
    view_count INT DEFAULT 0 COMMENT '阅读量',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    publish_time DATETIME COMMENT '发布时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    INDEX idx_author_id (author_id),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_publish_time (publish_time)
) COMMENT '博客表';

-- 创建博客标签关联表
CREATE TABLE IF NOT EXISTS tb_blog_tag (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
    blog_id BIGINT NOT NULL COMMENT '博客ID',
    tag_id BIGINT NOT NULL COMMENT '标签ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_blog_tag (blog_id, tag_id)
) COMMENT '博客标签关联表';

-- 创建评论表
CREATE TABLE IF NOT EXISTS tb_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    blog_id BIGINT NOT NULL COMMENT '博客ID',
    user_id BIGINT NOT NULL COMMENT '评论者ID',
    parent_id BIGINT COMMENT '父评论ID（用于回复）',
    reply_user_id BIGINT COMMENT '回复目标用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    status INT DEFAULT 1 COMMENT '评论状态：0-待审核，1-已通过，2-已拒绝',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted INT DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
    INDEX idx_blog_id (blog_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_id (parent_id)
) COMMENT '评论表';