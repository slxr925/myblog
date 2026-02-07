package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 审计日志实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_audit_log")
public class AuditLog {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("operator_id")
    private Long operatorId;

    @TableField("action")
    private String action;

    @TableField("target_type")
    private String targetType;

    @TableField("target_id")
    private Long targetId;

    @TableField("detail_json")
    private String detailJson;

    @TableField("ip")
    private String ip;

    @TableField("user_agent")
    private String userAgent;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
