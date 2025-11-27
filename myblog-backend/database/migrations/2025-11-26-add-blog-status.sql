-- 文章可见性字段调整
ALTER TABLE tb_blog
    ADD COLUMN IF NOT EXISTS visibility TINYINT NOT NULL DEFAULT 1 COMMENT '可见性：0-私密，1-公开' AFTER status;
