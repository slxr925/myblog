package com.ryan.myblog.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 博客文章实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_blog")
public class Blog {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 文章标题
     */
    @TableField("title")
    private String title;
    
    /**
     * 文章摘要
     */
    @TableField("summary")
    private String summary;
    
    /**
     * 文章内容
     */
    @TableField("content")
    private String content;
    
    /**
     * 文章封面图片
     */
    @TableField("cover_img")
    private String coverImg;
    
    /**
     * 作者ID
     */
    @TableField("author_id")
    private Long authorId;
    
    /**
     * 分类ID
     */
    @TableField("category_id")
    private Long categoryId;
    
    /**
     * 文章状态：0-草稿，1-已发布，2-已下线
     */
    @TableField("status")
    private Integer status;
    
    /**
     * 是否置顶：0-否，1-是
     */
    @TableField("is_top")
    private Integer isTop;
    
    /**
     * 阅读量
     */
    @TableField("view_count")
    private Integer viewCount;
    
    /**
     * 点赞数
     */
    @TableField("like_count")
    private Integer likeCount;
    
    /**
     * 评论数
     */
    @TableField("comment_count")
    private Integer commentCount;
    
    /**
     * 发布时间
     */
    @TableField("publish_time")
    private LocalDateTime publishTime;
    
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
     * 是否删除：0-未删除，1-已删除
     */
    @TableLogic
    @TableField("deleted")
    private Integer deleted;
}