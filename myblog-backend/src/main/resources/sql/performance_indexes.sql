-- 博客系统性能优化 - 数据库索引脚本
-- 创建时间：2025-12-07

-- 1. 博客表索引
-- 为博客标题添加索引（用于搜索）
CREATE INDEX IF NOT EXISTS idx_tb_blog_title ON tb_blog(title);

-- 为博客摘要添加索引（用于搜索）
CREATE INDEX IF NOT EXISTS idx_tb_blog_summary ON tb_blog(summary);

-- 为分类ID添加索引（用于按分类查询）
CREATE INDEX IF NOT EXISTS idx_tb_blog_category_id ON tb_blog(category_id);

-- 为作者ID添加索引（用于查询作者文章）
CREATE INDEX IF NOT EXISTS idx_tb_blog_author_id ON tb_blog(author_id);

-- 为状态添加索引（用于过滤已发布/草稿）
CREATE INDEX IF NOT EXISTS idx_tb_blog_status ON tb_blog(status);

-- 为创建时间添加索引（用于排序）
CREATE INDEX IF NOT EXISTS idx_tb_blog_create_time ON tb_blog(create_time);

-- 为发布时间添加索引（用于按发布时间排序）
CREATE INDEX IF NOT EXISTS idx_tb_blog_publish_time ON tb_blog(publish_time);

-- 为浏览量添加索引（用于热门博客排序）
CREATE INDEX IF NOT EXISTS idx_tb_blog_view_count ON tb_blog(view_count);

-- 为点赞量添加索引（用于热门博客排序）
CREATE INDEX IF NOT EXISTS idx_tb_blog_like_count ON tb_blog(like_count);

-- 复合索引：用于博客列表查询
CREATE INDEX IF NOT EXISTS idx_tb_blog_list_query ON tb_blog(status, deleted, is_top, create_time DESC);

-- 复合索引：用于热门博客查询
CREATE INDEX IF NOT EXISTS idx_tb_blog_hot_query ON tb_blog(status, deleted, view_count DESC, like_count DESC, publish_time DESC);

-- 复合索引：用于最新博客查询
CREATE INDEX IF NOT EXISTS idx_tb_blog_latest_query ON tb_blog(status, deleted, publish_time DESC;

-- 2. 博客标签关联表索引
-- 为博客ID添加索引（用于查询博客的所有标签）
CREATE INDEX IF NOT EXISTS idx_tb_blog_tag_blog_id ON tb_blog_tag(blog_id);

-- 为标签ID添加索引（用于查询包含某标签的博客）
CREATE INDEX IF NOT EXISTS idx_tb_blog_tag_tag_id ON tb_blog_tag(tag_id);

-- 复合索引：用于按博客ID和标签ID查询
CREATE INDEX IF NOT EXISTS idx_tb_blog_tag_blog_tag ON tb_blog_tag(blog_id, tag_id);

-- 3. 用户点赞表索引
-- 为用户ID添加索引（用于查询用户的点赞记录）
CREATE INDEX IF NOT EXISTS idx_tb_user_like_user_id ON tb_user_like(user_id);

-- 为目标类型和目标ID添加复合索引（用于查询某篇文章的点赞统计）
CREATE INDEX IF NOT EXISTS idx_tb_user_like_target ON tb_user_like(target_type, target_id);

-- 复合索引：用于查询用户对特定目标的点赞状态
CREATE INDEX IF NOT EXISTS idx_tb_user_like_user_target ON tb_user_like(user_id, target_type, target_id);

-- 复合索引：用于统计点赞数
CREATE INDEX IF NOT EXISTS idx_tb_user_like_target_status ON tb_user_like(target_type, target_id, status);

-- 4. 评论表索引（如果存在）
-- 为博客ID添加索引（用于查询某篇文章的评论）
CREATE INDEX IF NOT EXISTS idx_tb_comment_blog_id ON tb_comment(blog_id);

-- 为用户ID添加索引（用于查询用户的评论）
CREATE INDEX IF NOT EXISTS idx_tb_comment_user_id ON tb_comment(user_id);

-- 为创建时间添加索引（用于评论排序）
CREATE INDEX IF NOT EXISTS idx_tb_comment_create_time ON tb_comment(create_time);

-- 复合索引：用于评论列表查询
CREATE INDEX IF NOT EXISTS idx_tb_comment_list_query ON tb_comment(blog_id, deleted, create_time DESC);

-- 5. 分类表索引
-- 为分类名称添加唯一索引（确保分类名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_category_name ON tb_category(name);

-- 6. 标签表索引
-- 为标签名称添加唯一索引（确保标签名唯一）
CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_tag_name ON tb_tag(name);

-- 7. 用户表索引
-- 为用户名添加唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_user_username ON tb_user(username);

-- 为邮箱添加唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_tb_user_email ON tb_user(email);

-- 为昵称添加索引（用于用户搜索）
CREATE INDEX IF NOT EXISTS idx_tb_user_nickname ON tb_user(nickname);

-- 8. 优化建议：分区表（如果数据量很大）
-- 对于大量历史数据，可以考虑按时间分区
-- ALTER TABLE tb_blog PARTITION BY RANGE (YEAR(create_time)) (
--     PARTITION p2023 VALUES LESS THAN (2024),
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION p_future VALUES LESS THAN MAXVALUE
-- );

-- 注意事项：
-- 1. 索引会增加写操作的开销，但会大幅提升查询性能
-- 2. 定期使用 ANALYZE TABLE 更新表的统计信息
-- 3. 监控慢查询日志，根据实际情况调整索引策略
-- 4. 对于特别大的表，考虑使用覆盖索引减少回表查询