-- 初始化数据

USE myblog;

-- 插入管理员用户 (密码: admin123)
INSERT INTO tb_user (username, password, email, nickname, status, role) VALUES 
('admin', '$2a$10$s..vvWEe0IEuXtRSBE0XYeE9GnUQgcGCmFYdYyVqi9tpk0hvTwsN6', 'admin@myblog.com', '管理员', 0, 1);

-- 插入普通用户 (密码: user123)
INSERT INTO tb_user (username, password, email, nickname, status, role) VALUES 
('testuser', '$2a$10$oMk8xCFRqi4VXKfher8GZeAvRSmOyw4ppajclEEkJflERJ5ZNXciW', 'user@myblog.com', '测试用户', 0, 0);

-- 插入分类数据
INSERT INTO tb_category (name, description, icon, sort) VALUES 
('技术分享', 'Java、Spring、数据库等技术文章', 'tech', 1),
('生活随笔', '日常生活感悟和随想', 'life', 2),
('学习笔记', '学习过程中的笔记和总结', 'study', 3),
('项目实战', '实际项目开发经验分享', 'project', 4);

-- 插入标签数据
INSERT INTO tb_tag (name, color) VALUES 
('Java', '#f56a00'),
('Spring Boot', '#722ed1'),
('MySQL', '#1890ff'),
('Redis', '#eb2f96'),
('Vue.js', '#52c41a'),
('Docker', '#13c2c2'),
('微服务', '#faad14'),
('算法', '#fa541c'),
('前端', '#2f54eb'),
('后端', '#389e0d');

-- 插入示例博客
INSERT INTO tb_blog (title, summary, content, author_id, category_id, status, is_top, view_count, like_count, comment_count, publish_time) VALUES 
('Spring Boot 3.x 新特性详解', 'Spring Boot 3.x 版本带来了很多令人兴奋的新特性，本文将详细介绍这些新特性的使用方法和最佳实践。', 
'# Spring Boot 3.x 新特性详解\n\n## 1. 最低要求 JDK 17\n\nSpring Boot 3.x 要求最低 JDK 版本为 17，这意味着你可以使用 Java 17 的所有新特性。\n\n## 2. 原生支持\n\nSpring Boot 3.x 支持编译为原生镜像，显著提升启动速度和减少内存占用。\n\n## 3. 观察性改进\n\n新版本在应用监控和观察性方面有了重大改进，包括：\n- Micrometer Tracing\n- 改进的 Actuator\n- 更好的监控集成\n\n这些改进使得应用的监控和调试变得更加容易。', 
1, 1, 1, 1, 156, 23, 5, NOW()),

('个人博客系统设计思路', '分享一下设计和开发个人博客系统的整体思路，包括技术选型、架构设计和功能规划。', 
'# 个人博客系统设计思路\n\n## 技术选型\n\n### 后端技术栈\n- Spring Boot 3.x\n- Spring Security\n- MyBatis Plus\n- MySQL 8.x\n- Redis\n- JWT\n\n### 前端技术栈\n- Vue 3\n- Element Plus\n- Vite\n\n## 架构设计\n\n采用前后端分离的架构，后端提供 RESTful API，前端使用 Vue 3 构建单页应用。\n\n## 功能模块\n\n1. 用户管理\n2. 博客管理\n3. 分类管理\n4. 标签管理\n5. 评论系统\n\n每个模块都有完整的 CRUD 操作和权限控制。', 
1, 4, 1, 0, 89, 15, 3, NOW()),

('MySQL 8.4 性能优化实践', 'MySQL 8.4 版本在性能方面有了显著提升，本文分享一些实际的优化经验和最佳实践。', 
'# MySQL 8.4 性能优化实践\n\n## 索引优化\n\n### 1. 合理创建索引\n- 为经常查询的字段创建索引\n- 避免过多的索引影响写入性能\n- 使用复合索引优化多字段查询\n\n### 2. 索引维护\n- 定期分析索引使用情况\n- 删除不必要的索引\n- 重建碎片化的索引\n\n## 查询优化\n\n### 1. SQL 语句优化\n- 避免 SELECT *\n- 使用合适的 WHERE 条件\n- 合理使用 JOIN\n\n### 2. 执行计划分析\n使用 EXPLAIN 分析查询执行计划，找出性能瓶颈。\n\n## 配置优化\n\n合理配置 MySQL 参数，如缓冲池大小、连接数等。', 
1, 1, 1, 0, 234, 18, 7, NOW());

-- 插入博客标签关联
INSERT INTO tb_blog_tag (blog_id, tag_id) VALUES 
(1, 2), (1, 1), (1, 10),  -- Spring Boot 3.x 新特性详解
(2, 1), (2, 2), (2, 3), (2, 5), (2, 7), (2, 9), (2, 10), -- 个人博客系统设计思路
(3, 3), (3, 10); -- MySQL 8.4 性能优化实践

-- 插入示例评论
INSERT INTO tb_comment (blog_id, user_id, content, status, like_count) VALUES 
(1, 2, '文章写得很好，对Spring Boot 3.x的新特性介绍很全面！', 1, 5),
(1, 2, '期待更多关于原生镜像的实践文章', 1, 3),
(2, 2, '架构设计很清晰，技术选型也很合理', 1, 2),
(3, 2, 'MySQL优化的建议很实用，已经在项目中应用了', 1, 4);