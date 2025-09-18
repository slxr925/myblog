-- 用户点赞记录表
CREATE TABLE IF NOT EXISTS `tb_user_like` (
    `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id` bigint NOT NULL COMMENT '用户ID',
    `target_type` varchar(20) NOT NULL COMMENT '目标类型：blog-博客，comment-评论',
    `target_id` bigint NOT NULL COMMENT '点赞目标ID',
    `status` tinyint NOT NULL DEFAULT '1' COMMENT '点赞状态：1-点赞，0-取消点赞',
    `create_time` datetime NOT NULL COMMENT '创建时间',
    `update_time` datetime NOT NULL COMMENT '更新时间',
    `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除，1-已删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_target` (`user_id`, `target_type`, `target_id`),
    KEY `idx_target` (`target_type`, `target_id`, `status`),
    KEY `idx_user` (`user_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户点赞记录表';