-- 文章状态重构与数据迁移

ALTER TABLE tb_blog
    MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '文章状态：0-草稿，1-已发布，2-已下线',
    MODIFY COLUMN publish_time DATETIME NULL COMMENT '发布时间';

ALTER TABLE tb_blog
    ADD COLUMN status_changed_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '状态变更时间' AFTER publish_time;

UPDATE tb_blog
SET status = IFNULL(status, 0);

UPDATE tb_blog
SET publish_time = CASE
        WHEN status = 1 AND publish_time IS NULL THEN update_time
        ELSE publish_time
    END;

UPDATE tb_blog
SET status_changed_time = COALESCE(status_changed_time, publish_time, update_time, create_time);

