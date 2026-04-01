package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文章推荐卡片VO
 */
@Data
public class BlogRecommendationVO {

    private Long id;
    private String publicId;
    private String title;
    private Long categoryId;
    private String categoryName;
    private LocalDateTime publishTime;
}
