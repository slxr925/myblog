package com.ryan.myblog.dto;

import lombok.Data;

import java.util.List;

/**
 * 搜索请求DTO
 */
@Data
public class SearchRequestDTO {
    
    /**
     * 搜索关键词
     */
    private String keyword;
    
    /**
     * 分类ID
     */
    private Long categoryId;
    
    /**
     * 标签ID列表
     */
    private List<Long> tagIds;
    
    /**
     * 作者ID
     */
    private Long authorId;
    
    /**
     * 博客状态：0-草稿，1-已发布，2-已下线
     */
    private Integer status = 1; // 默认只搜索已发布的博客
    
    /**
     * 排序方式：score-相关度，time-时间，view-阅读量，like-点赞数
     */
    private String sortBy = "score";
    
    /**
     * 排序方向：asc-升序，desc-降序
     */
    private String sortDir = "desc";
    
    /**
     * 页码
     */
    private Integer page = 1;
    
    /**
     * 每页大小
     */
    private Integer size = 10;
}