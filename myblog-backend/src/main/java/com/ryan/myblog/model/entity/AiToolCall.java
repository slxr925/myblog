package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("tb_ai_tool_call")
public class AiToolCall {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("conversation_id")
    private String conversationId;

    @TableField("message_id")
    private Long messageId;

    @TableField("tool_name")
    private String toolName;

    @TableField("arguments_json")
    private String argumentsJson;

    @TableField("result_summary")
    private String resultSummary;

    @TableField("status")
    private String status;

    @TableField("elapsed_ms")
    private Long elapsedMs;

    @TableField("error_message")
    private String errorMessage;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
