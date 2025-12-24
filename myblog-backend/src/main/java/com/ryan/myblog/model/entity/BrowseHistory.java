package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 浏览记录实体类
 * 用于记录用户浏览文章的历史
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_browse_history")
public class BrowseHistory {

    /**
     * 浏览记录ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    @TableField("user_id")
    private Long userId;

    /**
     * 文章ID
     */
    @TableField("blog_id")
    private Long blogId;

    /**
     * 浏览时间（最新浏览时间）
     */
    @TableField("browse_time")
    private LocalDateTime browseTime;

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
