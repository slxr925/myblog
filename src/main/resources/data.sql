-- 插入管理员用户 (密码: admin123)
INSERT INTO tb_user (username, password, email, nickname, status, role, create_time, update_time) VALUES 
('admin', '$2a$10$s..vvWEe0IEuXtRSBE0XYeE9GnUQgcGCmFYdYyVqi9tpk0hvTwsN6', 'admin@myblog.com', '管理员', 0, 1, NOW(), NOW());

-- 插入普通用户 (密码: user123)
INSERT INTO tb_user (username, password, email, nickname, status, role, create_time, update_time) VALUES 
('testuser', '$2a$10$oMk8xCFRqi4VXKfher8GZeAvRSmOyw4ppajclEEkJflERJ5ZNXciW', 'user@myblog.com', '测试用户', 0, 0, NOW(), NOW());

-- 插入分类数据
INSERT INTO tb_category (name, description, icon, sort, create_time, update_time) VALUES 
('技术分享', 'Java、Spring、数据库等技术文章', 'tech', 1, NOW(), NOW()),
('生活随笔', '日常生活感悟和随想', 'life', 2, NOW(), NOW()),
('学习笔记', '学习过程中的笔记和总结', 'study', 3, NOW(), NOW()),
('项目实战', '实际项目开发经验分享', 'project', 4, NOW(), NOW());

-- 插入标签数据
INSERT INTO tb_tag (name, color, create_time, update_time) VALUES 
('Java', '#f56a00', NOW(), NOW()),
('Spring Boot', '#722ed1', NOW(), NOW()),
('MySQL', '#1890ff', NOW(), NOW()),
('Redis', '#eb2f96', NOW(), NOW()),
('Vue.js', '#52c41a', NOW(), NOW());

-- 插入示例博客
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, is_top, view_count, like_count, comment_count, publish_time, create_time, update_time) VALUES 
('Spring Boot 3.x 新特性详解', 'Spring Boot 3.x 版本带来了很多令人兴奋的新特性', '# Spring Boot 3.x 新特性详解\n\n## 1. 最低要求 JDK 17\n\nSpring Boot 3.x 要求最低 JDK 版本为 17。', 1, 1, 1, 1, 156, 23, 5, NOW(), NOW(), NOW()),
('个人博客系统设计思路', '分享一下设计和开发个人博客系统的整体思路', '# 个人博客系统设计思路\n\n## 技术选型\n\n### 后端技术栈\n- Spring Boot 3.x', 1, 4, 1, 0, 89, 15, 3, NOW(), NOW(), NOW());