package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户收藏VO（包含博客信息）
 */
@Data
public class UserCollectionVO {

    /**
     * 收藏ID
     */
    private Long id;

    /**
     * 收藏夹ID
     */
    private Long folderId;

    /**
     * 收藏夹名称
     */
    private String folderName;

    /**
     * 收藏的博客信息（嵌套对象）
     */
    private BlogListVO blog;

    /**
     * 博客ID（扁平化字段）
     */
    private Long blogId;

    /**
     * 博客标题（扁平化字段）
     */
    private String blogTitle;

    /**
     * 博客摘要（扁平化字段）
     */
    private String blogSummary;

    /**
     * 作者名称（扁平化字段）
     */
    private String authorName;

    /**
     * 浏览量（扁平化字段）
     */
    private Long viewCount;

    /**
     * 收藏备注
     */
    private String note;

    /**
     * 收藏时间
     */
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}