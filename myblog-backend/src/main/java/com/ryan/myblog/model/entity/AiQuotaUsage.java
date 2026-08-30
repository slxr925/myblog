package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("tb_ai_quota_usage")
public class AiQuotaUsage {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("request_id")
    private String requestId;

    @TableField("user_id")
    private Long userId;

    @TableField("usage_date")
    private LocalDate usageDate;

    @TableField("action")
    private String action;

    @TableField("status")
    private String status;

    @TableField("estimated_tokens")
    private Integer estimatedTokens;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
