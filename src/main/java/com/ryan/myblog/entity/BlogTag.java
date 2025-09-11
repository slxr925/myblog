package com.ryan.myblog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 博客标签关联实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_blog_tag")
public class BlogTag {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 博客ID
     */
    @TableField("blog_id")
    private Long blogId;
    
    /**
     * 标签ID
     */
    @TableField("tag_id")
    private Long tagId;
    
    /**
     * 创建时间
     */
    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}