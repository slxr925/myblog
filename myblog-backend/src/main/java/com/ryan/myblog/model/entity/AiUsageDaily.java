package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * AI使用统计（日维度）
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_ai_usage_daily")
public class AiUsageDaily {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("usage_date")
    private LocalDate usageDate;

    @TableField("request_count")
    private Integer requestCount;

    @TableField("token_count")
    private Integer tokenCount;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
