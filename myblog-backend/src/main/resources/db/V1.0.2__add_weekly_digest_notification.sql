ALTER TABLE tb_notification_setting
    ADD COLUMN enable_weekly_digest TINYINT DEFAULT 1 COMMENT '是否开启周报摘要通知' AFTER enable_stats;
