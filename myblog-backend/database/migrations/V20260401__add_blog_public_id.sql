-- 为公开文章链接引入 UUID public_id。
-- 该脚本设计为幂等执行，便于在已经手工改过库的环境中补录到正式迁移体系。

SET @public_id_column_exists := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'tb_blog'
      AND column_name = 'public_id'
);

SET @add_public_id_column_sql := IF(
    @public_id_column_exists = 0,
    "ALTER TABLE tb_blog ADD COLUMN public_id VARCHAR(36) NULL COMMENT '公开访问ID（UUID）' AFTER id",
    "SELECT 'public_id column already exists'"
);

PREPARE add_public_id_column_stmt FROM @add_public_id_column_sql;
EXECUTE add_public_id_column_stmt;
DEALLOCATE PREPARE add_public_id_column_stmt;

UPDATE tb_blog
SET public_id = UUID()
WHERE public_id IS NULL OR public_id = '';

ALTER TABLE tb_blog
    MODIFY COLUMN public_id VARCHAR(36) NOT NULL COMMENT '公开访问ID（UUID）';

SET @legacy_public_id_index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'tb_blog'
      AND index_name = 'idx_public_id'
);

SET @drop_legacy_public_id_index_sql := IF(
    @legacy_public_id_index_exists > 0,
    'ALTER TABLE tb_blog DROP INDEX idx_public_id',
    "SELECT 'idx_public_id not found'"
);

PREPARE drop_legacy_public_id_index_stmt FROM @drop_legacy_public_id_index_sql;
EXECUTE drop_legacy_public_id_index_stmt;
DEALLOCATE PREPARE drop_legacy_public_id_index_stmt;

SET @public_id_unique_index_exists := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'tb_blog'
      AND index_name = 'uk_blog_public_id'
);

SET @add_public_id_unique_index_sql := IF(
    @public_id_unique_index_exists = 0,
    'ALTER TABLE tb_blog ADD UNIQUE INDEX uk_blog_public_id (public_id)',
    "SELECT 'uk_blog_public_id already exists'"
);

PREPARE add_public_id_unique_index_stmt FROM @add_public_id_unique_index_sql;
EXECUTE add_public_id_unique_index_stmt;
DEALLOCATE PREPARE add_public_id_unique_index_stmt;
