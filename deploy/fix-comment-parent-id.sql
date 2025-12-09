-- 修复评论表 parent_id 字段的外键约束问题
-- 问题：前端使用 parentId: 0 表示顶级评论，但数据库有外键约束不允许 0 值
-- 解决：删除 parent_id 的外键约束，改为在应用层处理

USE myblog;

-- 显示当前表结构
SHOW CREATE TABLE tb_comment\G

-- 删除 parent_id 的外键约束
-- 注意：外键约束名称可能是 tb_comment_ibfk_3，先查看具体名称
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'myblog' AND TABLE_NAME = 'tb_comment' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 删除外键约束（根据实际名称调整）
ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3;

-- 修改字段定义为 NULL（如果还不是 NULL）
ALTER TABLE tb_comment MODIFY COLUMN parent_id BIGINT DEFAULT NULL COMMENT '父评论ID，NULL表示顶级评论';

-- 更新现有的 0 值为 NULL
UPDATE tb_comment SET parent_id = NULL WHERE parent_id = 0;

-- 显示修复结果
SELECT
    '修复前的统计' as 说明,
    COUNT(*) as total_comments,
    COUNT(CASE WHEN parent_id = 0 THEN 1 END) as zero_parent_comments,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as null_parent_comments
FROM tb_comment;

-- 验证修复后
SELECT
    '修复后的统计' as 说明,
    COUNT(*) as total_comments,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as top_level_comments
FROM tb_comment;