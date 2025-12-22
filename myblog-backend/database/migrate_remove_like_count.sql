-- ============================================
-- 数据库迁移脚本：删除冗余的点赞/评论计数字段
-- 创建时间：2025-12-22
-- 说明：删除 tb_blog 和 tb_comment 表中的冗余计数字段
--       所有计数将通过 tb_user_like 和 tb_comment 表实时查询
-- ============================================

-- 1. 备份当前数据（可选，建议在生产环境执行前手动备份）
--    CREATE TABLE tb_blog_backup_20251222 AS SELECT * FROM tb_blog;
--    CREATE TABLE tb_comment_backup_20251222 AS SELECT * FROM tb_comment;

USE myblog;

-- 2. 删除 tb_blog 表的冗余字段
ALTER TABLE tb_blog DROP COLUMN IF EXISTS like_count;
ALTER TABLE tb_blog DROP COLUMN IF EXISTS comment_count;

-- 3. 删除 tb_comment 表的冗余字段
ALTER TABLE tb_comment DROP COLUMN IF EXISTS like_count;

-- 4. 验证字段已删除
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'myblog' 
  AND TABLE_NAME = 'tb_blog' 
  AND COLUMN_NAME IN ('like_count', 'comment_count');

SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'myblog' 
  AND TABLE_NAME = 'tb_comment' 
  AND COLUMN_NAME = 'like_count';

-- 5. 验证索引状态（确保 tb_user_like 表有正确的索引以优化查询性能）
SHOW INDEX FROM tb_user_like WHERE Key_name = 'idx_target';

-- 如果索引不存在，创建它：
-- CREATE INDEX idx_target ON tb_user_like(target_type, target_id, status, deleted);

-- ============================================
-- 迁移完成！
-- ============================================
