-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    action VARCHAR(50) NOT NULL COMMENT '操作类型',
    resource VARCHAR(100) NOT NULL COMMENT '资源类型',
    resource_id VARCHAR(100) COMMENT '资源ID',
    ip VARCHAR(50) COMMENT '客户端IP',
    user_agent VARCHAR(500) COMMENT '用户代理',
    params TEXT COMMENT '请求参数',
    response_status INT COMMENT '响应状态码',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';




