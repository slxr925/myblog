-- ============================================================================
-- MyBlog 数据库增量升级脚本
-- 从 v1.0 升级到 v2.0
--
-- 说明：此脚本用于在现有生产数据库上增量添加新字段
-- 执行方式：mysql -u用户名 -p密码 数据库名 < upgrade_v1_to_v2.sql
-- ============================================================================

-- 开始事务
START TRANSACTION;

-- 1. 收藏夹分享功能 - 添加公开收藏和分享相关字段
-- 如果字段已存在会报错，可以忽略或使用更安全的检查方式

ALTER TABLE tb_collection_folder
ADD COLUMN IF NOT EXISTS is_public TINYINT(1) DEFAULT 0 COMMENT '是否公开（0私有1公开）',
ADD COLUMN IF NOT EXISTS share_code VARCHAR(32) DEFAULT NULL COMMENT '分享码',
ADD COLUMN IF NOT EXISTS share_expire_time DATETIME DEFAULT NULL COMMENT '分享过期时间';

-- 添加索引（如果不存在）
-- 注意：MySQL 5.7+ 不支持 IF NOT EXISTS 语法创建索引，需要忽略错误
CREATE INDEX IF NOT EXISTS idx_share_code ON tb_collection_folder(share_code);

-- ============================================================================
-- 升级完成提示
-- ============================================================================

SELECT '=====================================' AS '';
SELECT '数据库升级完成！' AS '状态';
SELECT 'v1.0 -> v2.0' AS '版本';
SELECT '=====================================' AS '';

-- 查看表结构确认
DESCRIBE tb_collection_folder;

-- 提交事务
COMMIT;

-- ============================================================================
-- 回滚脚本（如需回滚，请执行以下SQL）
-- ============================================================================
/*
START TRANSACTION;

ALTER TABLE tb_collection_folder
DROP COLUMN IF EXISTS is_public,
DROP COLUMN IF EXISTS share_code,
DROP COLUMN IF EXISTS share_expire_time;

DROP INDEX IF EXISTS idx_share_code ON tb_collection_folder;

COMMIT;
*/
