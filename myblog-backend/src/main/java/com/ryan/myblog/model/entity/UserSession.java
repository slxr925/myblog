package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户会话实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_user_session")
public class UserSession {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("user_id")
    private Long userId;

    @TableField("refresh_jti")
    private String refreshJti;

    @TableField("ip")
    private String ip;

    @TableField("user_agent")
    private String userAgent;

    @TableField("device_label")
    private String deviceLabel;

    @TableField("last_seen_time")
    private LocalDateTime lastSeenTime;

    @TableField("expires_time")
    private LocalDateTime expiresTime;

    @TableField("revoked")
    private Integer revoked;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
