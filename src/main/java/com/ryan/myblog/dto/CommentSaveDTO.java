package com.ryan.myblog.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 评论保存DTO
 */
@Data
public class CommentSaveDTO {
    
    /**
     * 博客ID
     */
    @NotNull(message = "博客ID不能为空")
    private Long blogId;
    
    /**
     * 评论内容
     */
    @NotBlank(message = "评论内容不能为空")
    private String content;
    
    /**
     * 父评论ID（回复评论时使用）
     */
    private Long parentId;
    
    /**
     * 回复目标用户ID（回复评论时使用）
     */
    private Long replyUserId;
}