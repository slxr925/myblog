package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户关注关系实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_user_follow")
public class UserFollow {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 关注者ID（粉丝）
     */
    @TableField("follower_id")
    private Long followerId;

    /**
     * 被关注者ID
     */
    @TableField("followee_id")
    private Long followeeId;

    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @TableField(value = "update_time", fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    /**
     * 逻辑删除：0-未删除，1-已删除
     */
    @TableField("deleted")
    private Integer deleted;
}
