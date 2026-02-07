package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户屏蔽关系
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_user_block")
public class UserBlock {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("blocker_id")
    private Long blockerId;

    @TableField("blocked_id")
    private Long blockedId;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
