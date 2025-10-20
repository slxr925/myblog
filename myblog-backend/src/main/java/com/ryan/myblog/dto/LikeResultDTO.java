package com.ryan.myblog.dto;

import lombok.Data;

/**
 * 点赞操作结果DTO
 */
@Data
public class LikeResultDTO {
    /**
     * 操作后的点赞状态（true-已点赞，false-未点赞）
     */
    private Boolean isLiked;

    /**
     * 更新后的点赞总数
     */
    private Integer likeCount;

    /**
     * 更新后的浏览量
     */
    private Integer viewCount;

    public LikeResultDTO(Boolean isLiked, Integer likeCount, Integer viewCount) {
        this.isLiked = isLiked;
        this.likeCount = likeCount;
        this.viewCount = viewCount;
    }
}