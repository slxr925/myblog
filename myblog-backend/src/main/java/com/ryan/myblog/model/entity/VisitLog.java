package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 访问日志实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_visit_log")
public class VisitLog {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 访问的页面
     */
    @TableField("page")
    private String page;

    /**
     * 访问IP地址
     */
    @TableField("ip_address")
    private String ipAddress;

    /**
     * 用户代理
     */
    @TableField("user_agent")
    private String userAgent;

    /**
     * 用户ID（如果已登录）
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 访问时间
     */
    @TableField(value = "visit_time", fill = FieldFill.INSERT)
    private LocalDateTime visitTime;

    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 逻辑删除标记
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}