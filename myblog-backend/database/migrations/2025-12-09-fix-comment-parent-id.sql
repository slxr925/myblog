-- 数据库迁移：修复评论表 parent_id 外键约束问题
-- 日期：2025-12-09
-- 问题描述：
--   - 前端使用 parentId: 0 表示顶级评论
--   - 生产环境数据库有外键约束不允许 parent_id = 0
--   - 导致评论提交时出现外键约束失败错误

-- 迁移脚本
USE myblog;

-- 步骤1：检查当前表状态
SELECT '=== 当前表结构 ===' as info;
SHOW CREATE TABLE tb_comment\G

-- 步骤2：检查外键约束
SELECT '=== 外键约束信息 ===' as info;
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'myblog'
    AND TABLE_NAME = 'tb_comment'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 步骤3：如果有 parent_id 的外键约束，则删除它
SET @sql = (SELECT IF EXISTS(
    SELECT 1 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'myblog'
        AND TABLE_NAME = 'tb_comment'
        AND COLUMN_NAME = 'parent_id'
        AND REFERENCED_TABLE_NAME = 'tb_comment'),
    'ALTER TABLE tb_comment DROP FOREIGN KEY tb_comment_ibfk_3',
    'SELECT "No foreign key to drop" as message'
));

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 步骤4：修改字段定义，允许 NULL 并更新注释
ALTER TABLE tb_comment
    MODIFY COLUMN parent_id BIGINT DEFAULT NULL
    COMMENT '父评论ID（用于回复），NULL表示顶级评论';

-- 步骤5：更新现有的 0 值为 NULL
UPDATE tb_comment
SET parent_id = NULL
WHERE parent_id = 0;

-- 步骤6：显示迁移结果
SELECT '=== 迁移完成 ===' as info;
SELECT
    COUNT(*) as total_comments,
    COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as top_level_comments,
    COUNT(CASE WHEN parent_id > 0 THEN 1 END) as reply_comments
FROM tb_comment;

-- 步骤7：验证数据完整性
SELECT '=== 数据验证 ===' as info;
-- 检查是否有无效的 parent_id（既不是 NULL 也不是有效 ID）
SELECT COUNT(*) as invalid_parent_count
FROM tb_comment c1
WHERE c1.parent_id IS NOT NULL
    AND c1.parent_id > 0
    AND NOT EXISTS (
        SELECT 1 FROM tb_comment c2
        WHERE c2.id = c1.parent_id
    );

-- 完成提示
SELECT '=== 迁移成功完成！ ===' as info;
SELECT '现在评论表不再有 parent_id 的外键约束，' as message;
SELECT '前端可以正常使用 parentId: 0 提交顶级评论。' as note;