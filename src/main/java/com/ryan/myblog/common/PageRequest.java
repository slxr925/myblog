package com.ryan.myblog.common;

import lombok.Data;

/**
 * 分页请求参数
 */
@Data
public class PageRequest {
    
    /**
     * 当前页码
     */
    private Integer page = 1;
    
    /**
     * 每页大小
     */
    private Integer size = 10;
    
    /**
     * 排序字段
     */
    private String orderBy;
    
    /**
     * 排序方向：asc, desc
     */
    private String orderDirection = "desc";
}