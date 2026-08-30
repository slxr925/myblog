CREATE TABLE IF NOT EXISTS tb_ai_quota_usage (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    request_id VARCHAR(64) NOT NULL COMMENT '请求幂等ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    usage_date DATE NOT NULL COMMENT '额度统计日期（Asia/Shanghai）',
    action VARCHAR(32) NOT NULL COMMENT 'AI动作',
    status VARCHAR(16) NOT NULL COMMENT 'RESERVED/CONSUMED/REFUNDED',
    estimated_tokens INT NOT NULL DEFAULT 1 COMMENT '预估Token数',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_quota_request_id (request_id),
    KEY idx_ai_quota_user_date (user_id, usage_date),
    KEY idx_ai_quota_status_create (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI额度请求流水表';
