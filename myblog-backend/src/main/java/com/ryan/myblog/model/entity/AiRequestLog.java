package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_ai_request_log")
public class AiRequestLog {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("request_id")
    private String requestId;

    @TableField("conversation_id")
    private String conversationId;

    @TableField("user_id")
    private Long userId;

    @TableField("action")
    private String action;

    @TableField("status")
    private String status;

    @TableField("prompt_key")
    private String promptKey;

    @TableField("prompt_version")
    private String promptVersion;

    @TableField("model")
    private String model;

    @TableField("prompt_chars")
    private Integer promptChars;

    @TableField("result_chars")
    private Integer resultChars;

    @TableField("tool_call_count")
    private Integer toolCallCount;

    @TableField("elapsed_ms")
    private Long elapsedMs;

    @TableField("error_message")
    private String errorMessage;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
