package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 搜索热词统计
 */
@Data
public class SearchTrendVO {
    private String keyword;
    private Long count;
}
