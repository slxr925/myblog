-- 移除已废弃的 publish_status 列，统一仅依赖 status 字段
ALTER TABLE tb_blog
    DROP COLUMN IF EXISTS publish_status;

