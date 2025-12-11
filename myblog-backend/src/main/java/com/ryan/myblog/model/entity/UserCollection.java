package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户收藏实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_user_collection")
public class UserCollection {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 收藏目标类型：blog-博客（预留扩展）
     */
    @TableField("target_type")
    private String targetType;

    /**
     * 收藏目标ID
     */
    @TableField("target_id")
    private Long targetId;

    /**
     * 收藏分类ID
     */
    @TableField("folder_id")
    private Long folderId;

    /**
     * 收藏备注
     */
    @TableField("note")
    private String note;

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
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}