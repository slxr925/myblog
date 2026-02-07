package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 博客版本历史实体
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_blog_revision")
public class BlogRevision {

    @TableId(value = "id", type = IdType.AUTO)
    private Long id;

    @TableField("blog_id")
    private Long blogId;

    @TableField("version")
    private Integer version;

    @TableField("title")
    private String title;

    @TableField("summary")
    private String summary;

    @TableField("content")
    private String content;

    @TableField("author_id")
    private Long authorId;

    @TableField(value = "create_time", fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
