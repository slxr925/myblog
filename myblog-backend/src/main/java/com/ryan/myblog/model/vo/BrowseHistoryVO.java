package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 浏览记录视图对象
 * 包含文章详细信息和浏览时间
 */
@Data
public class BrowseHistoryVO {

    /**
     * 浏览记录ID
     */
    private Long id;

    /**
     * 文章ID
     */
    private Long blogId;

    /**
     * 文章标题
     */
    private String title;

    /**
     * 文章摘要
     */
    private String summary;

    /**
     * 封面图片
     */
    private String coverImg;

    /**
     * 分类名称
     */
    private String categoryName;

    /**
     * 标签列表
     */
    private List<String> tags;

    /**
     * 浏览时间
     */
    private LocalDateTime browseTime;

    /**
     * 浏览量
     */
    private Integer viewCount;

    /**
     * 点赞数
     */
    private Integer likeCount;

    /**
     * 评论数
     */
    private Integer commentCount;
}
