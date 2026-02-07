package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 举报实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_report")
public class Report {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("reporter_id")
    private Long reporterId;

    @TableField("target_type")
    private String targetType;

    @TableField("target_id")
    private Long targetId;

    @TableField("reason")
    private String reason;

    @TableField("detail")
    private String detail;

    @TableField("status")
    private Integer status;

    @TableField("reviewer_id")
    private Long reviewerId;

    @TableField("review_time")
    private LocalDateTime reviewTime;

    @TableField("action")
    private String action;

    @TableField("notes")
    private String notes;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
