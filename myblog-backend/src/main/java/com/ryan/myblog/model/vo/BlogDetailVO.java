package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 博客详情VO
 */
@Data
public class BlogDetailVO {
    
    private Long id;
    private String title;
    private String summary;
    private String content;
    private String coverImg;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private Long categoryId;
    private String categoryName;
    private List<TagVO> tags;
    private Integer status;
    private Integer visibility;
    private Integer isTop;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isLiked;
    private LocalDateTime publishTime;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private LocalDateTime statusChangedTime;
}