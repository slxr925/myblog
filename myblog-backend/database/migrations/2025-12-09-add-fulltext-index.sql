-- =====================================================
-- MySQL全文索引优化 - 数据库迁移脚本
-- 版本: v1.1.7
-- 日期: 2025-12-09
-- 说明: 为tb_blog表添加全文索引，支持中文ngram分词，提升搜索性能10-100倍
-- =====================================================

USE myblog;

-- 1. 检查并显示当前全文索引配置
SELECT '当前ngram分词配置:' AS info;
SHOW VARIABLES LIKE 'ngram_token_size';

-- 2. 检查是否已存在全文索引
SELECT '检查现有全文索引:' AS info;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    INDEX_TYPE,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM 
    INFORMATION_SCHEMA.STATISTICS
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_blog'
    AND INDEX_TYPE = 'FULLTEXT'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE;

-- 3. 删除旧的全文索引（如果存在）
SET @index_exists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tb_blog'
    AND INDEX_NAME = 'ft_blog_search'
);

SET @drop_index_sql = IF(
    @index_exists > 0,
    'ALTER TABLE tb_blog DROP INDEX ft_blog_search',
    'SELECT "索引不存在，跳过删除" AS info'
);

PREPARE stmt FROM @drop_index_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 创建全文索引
SELECT '创建全文索引 ft_blog_search...' AS info;
ALTER TABLE tb_blog 
ADD FULLTEXT INDEX ft_blog_search (title, summary, content) 
WITH PARSER ngram
COMMENT '博客全文搜索索引，支持中文ngram分词';

-- 5. 验证索引创建成功
SELECT '验证索引创建结果:' AS info;
SHOW INDEX FROM tb_blog WHERE Key_name = 'ft_blog_search';

-- 6. 测试全文索引搜索（示例）
SELECT '全文索引搜索测试:' AS info;
SELECT 
    id,
    title,
    MATCH(title, summary, content) AGAINST('Spring' IN BOOLEAN MODE) AS relevance_score
FROM 
    tb_blog
WHERE 
    MATCH(title, summary, content) AGAINST('Spring' IN BOOLEAN MODE)
    AND status = 1 
    AND deleted = 0
ORDER BY 
    relevance_score DESC
LIMIT 3;

-- 7. 显示索引大小统计
SELECT '索引大小统计:' AS info;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    ROUND(STAT_VALUE * @@innodb_page_size / 1024 / 1024, 2) AS size_mb
FROM 
    mysql.innodb_index_stats
WHERE 
    DATABASE_NAME = DATABASE()
    AND TABLE_NAME = 'tb_blog'
    AND INDEX_NAME = 'ft_blog_search'
    AND STAT_NAME = 'size';

-- =====================================================
-- 迁移完成说明
-- =====================================================
-- 1. 全文索引已创建在 title, summary, content 三个字段上
-- 2. 使用ngram解析器，支持中文2字分词（需MySQL 5.7+）
-- 3. 索引大小约为原表的15-30%
-- 4. 搜索性能提升：LIKE模糊匹配 → 全文索引直接定位
-- 5. 代码已实现自动降级机制，索引失败时自动使用LIKE
-- 
-- 回滚方法（如需）:
-- ALTER TABLE tb_blog DROP INDEX ft_blog_search;
-- =====================================================
