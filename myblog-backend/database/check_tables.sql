-- 检查数据库中是否存在所有必要的表
USE myblog;

-- 显示所有表
SHOW TABLES;

-- 检查关键表是否存在
SELECT
    TABLE_NAME,
    TABLE_COMMENT,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'myblog'
    AND TABLE_NAME IN (
        'tb_user',
        'tb_blog',
        'tb_category',
        'tb_tag',
        'tb_blog_tag',
        'tb_comment',
        'tb_user_like',
        'tb_visit_log'
    )
ORDER BY TABLE_NAME;

-- 检查表结构和数据量
SELECT
    'tb_user' as table_name, COUNT(*) as count FROM tb_user
UNION ALL
SELECT
    'tb_blog' as table_name, COUNT(*) as count FROM tb_blog
UNION ALL
SELECT
    'tb_category' as table_name, COUNT(*) as count FROM tb_category
UNION ALL
SELECT
    'tb_tag' as table_name, COUNT(*) as count FROM tb_tag
UNION ALL
SELECT
    'tb_blog_tag' as table_name, COUNT(*) as count FROM tb_blog_tag
UNION ALL
SELECT
    'tb_comment' as table_name, COUNT(*) as count FROM tb_comment
UNION ALL
SELECT
    'tb_user_like' as table_name, COUNT(*) as count FROM tb_user_like
UNION ALL
SELECT
    'tb_visit_log' as table_name, COUNT(*) as count FROM tb_visit_log;