package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 收藏夹分类实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_collection_folder")
public class CollectionFolder {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 分类名称
     */
    @TableField("name")
    private String name;

    /**
     * 分类描述
     */
    @TableField("description")
    private String description;

    /**
     * 是否默认分类：0-否，1-是
     */
    @TableField("is_default")
    private Boolean isDefault;

    /**
     * 排序顺序
     */
    @TableField("sort_order")
    private Integer sortOrder;

    /**
     * 收藏数量（冗余字段）
     */
    @TableField("collection_count")
    private Integer collectionCount;

    /**
     * 是否公开：0-私密，1-公开
     */
    @TableField("is_public")
    private Boolean isPublic;

    /**
     * 分享码
     */
    @TableField("share_code")
    private String shareCode;

    /**
     * 分享过期时间
     */
    @TableField("share_expire_time")
    private LocalDateTime shareExpireTime;

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
