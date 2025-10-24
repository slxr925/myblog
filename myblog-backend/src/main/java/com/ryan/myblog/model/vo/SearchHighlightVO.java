package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 搜索结果高亮VO
 */
@Data
public class SearchHighlightVO {

    /**
     * 高亮的标题
     */
    private String title;

    /**
     * 高亮的摘要
     */
    private String summary;

    /**
     * 高亮的内容片段
     */
    private String content;

    /**
     * 高亮的标签
     */
    private String[] tags;
}