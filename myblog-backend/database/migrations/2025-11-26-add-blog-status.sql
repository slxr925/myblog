-- 文章可见性字段调整
-- 检查字段是否存在，不存在则添加
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'tb_blog' 
    AND COLUMN_NAME = 'visibility');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE tb_blog ADD COLUMN visibility TINYINT NOT NULL DEFAULT 1 COMMENT ''可见性：0-私密，1-公开'' AFTER status',
    'SELECT ''Column visibility already exists'' AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
