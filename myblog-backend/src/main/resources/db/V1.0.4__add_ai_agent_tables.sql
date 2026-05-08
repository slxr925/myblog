CREATE TABLE IF NOT EXISTS tb_ai_conversation (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    conversation_id VARCHAR(64) NOT NULL COMMENT '对话ID',
    user_id BIGINT NULL COMMENT '用户ID',
    title VARCHAR(120) NOT NULL DEFAULT '' COMMENT '对话标题',
    summary TEXT NULL COMMENT '压缩会话摘要',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_conversation_id (conversation_id),
    KEY idx_ai_conversation_user_update (user_id, update_time),
    KEY idx_ai_conversation_status_update (status, update_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI对话表';

CREATE TABLE IF NOT EXISTS tb_ai_message (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    conversation_id VARCHAR(64) NOT NULL COMMENT '对话ID',
    role VARCHAR(32) NOT NULL COMMENT '消息角色',
    content TEXT NOT NULL COMMENT '消息内容',
    token_estimate INT NOT NULL DEFAULT 0 COMMENT '估算token数',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_ai_message_conversation_time (conversation_id, create_time),
    KEY idx_ai_message_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI消息表';

CREATE TABLE IF NOT EXISTS tb_ai_tool_call (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    conversation_id VARCHAR(64) NULL COMMENT '对话ID',
    message_id BIGINT NULL COMMENT '触发消息ID',
    tool_name VARCHAR(100) NOT NULL COMMENT '工具名',
    arguments_json TEXT NULL COMMENT '参数JSON',
    result_summary TEXT NULL COMMENT '结果摘要',
    status VARCHAR(32) NOT NULL COMMENT '状态',
    elapsed_ms BIGINT NOT NULL DEFAULT 0 COMMENT '耗时毫秒',
    error_message VARCHAR(1000) NULL COMMENT '错误信息',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_ai_tool_conversation_time (conversation_id, create_time),
    KEY idx_ai_tool_name_time (tool_name, create_time),
    KEY idx_ai_tool_status_time (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI工具调用表';

CREATE TABLE IF NOT EXISTS tb_ai_request_log (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    request_id VARCHAR(64) NOT NULL COMMENT '请求ID',
    conversation_id VARCHAR(64) NULL COMMENT '对话ID',
    user_id BIGINT NULL COMMENT '用户ID',
    action VARCHAR(64) NOT NULL COMMENT 'AI动作',
    status VARCHAR(32) NOT NULL COMMENT '状态',
    prompt_key VARCHAR(100) NULL COMMENT 'Prompt Key',
    prompt_version VARCHAR(64) NULL COMMENT 'Prompt版本',
    model VARCHAR(120) NULL COMMENT '模型',
    prompt_chars INT NOT NULL DEFAULT 0 COMMENT 'Prompt字符数',
    result_chars INT NOT NULL DEFAULT 0 COMMENT '结果字符数',
    tool_call_count INT NOT NULL DEFAULT 0 COMMENT '工具调用次数',
    elapsed_ms BIGINT NOT NULL DEFAULT 0 COMMENT '耗时毫秒',
    error_message VARCHAR(1000) NULL COMMENT '错误信息',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_ai_request_id (request_id),
    KEY idx_ai_request_conversation_time (conversation_id, create_time),
    KEY idx_ai_request_user_time (user_id, create_time),
    KEY idx_ai_request_status_time (status, create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI请求日志表';
