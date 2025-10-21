package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 搜索结果VO
 */
@Data
public class SearchResultVO {
    
    private Long id;
    
    /**
     * 博客标题（可能包含高亮）
     */
    private String title;
    
    /**
     * 博客摘要（可能包含高亮）
     */
    private String summary;
    
    /**
     * 博客内容片段（可能包含高亮）
     */
    private String contentSnippet;
    
    /**
     * 作者昵称
     */
    private String authorNickname;
    
    /**
     * 分类名称
     */
    private String categoryName;
    
    /**
     * 标签名称列表
     */
    private List<String> tagNames;
    
    /**
     * 封面图片
     */
    private String coverImg;
    
    /**
     * 阅读量
     */
    private Long viewCount;
    
    /**
     * 点赞数
     */
    private Long likeCount;
    
    /**
     * 评论数
     */
    private Long commentCount;
    
    /**
     * 发布时间
     */
    private LocalDateTime publishTime;
    
    /**
     * 搜索评分
     */
    private Float score;
}