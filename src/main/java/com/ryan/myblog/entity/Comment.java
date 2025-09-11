package com.ryan.myblog.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 评论实体类
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName("tb_comment")
public class Comment {
    
    @TableId(value = "id", type = IdType.AUTO)
    private Long id;
    
    /**
     * 博客ID
     */
    @TableField("blog_id")
    private Long blogId;
    
    /**
     * 评论者ID
     */
    @TableField("user_id")
    private Long userId;
    
    /**
     * 父评论ID（用于回复）
     */
    @TableField("parent_id")
    private Long parentId;
    
    /**
     * 回复目标用户ID
     */
    @TableField("reply_user_id")
    private Long replyUserId;
    
    /**
     * 评论内容
     */
    @TableField("content")
    private String content;
    
    /**
     * 评论状态：0-待审核，1-已通过，2-已拒绝
     */
    @TableField("status")
    private Integer status;
    
    /**
     * 点赞数
     */
    @TableField("like_count")
    private Integer likeCount;
    
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