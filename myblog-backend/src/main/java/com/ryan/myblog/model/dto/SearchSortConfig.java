package com.ryan.myblog.model.dto;

import lombok.Data;

/**
 * 搜索排序配置
 */
@Data
public class SearchSortConfig {

    /**
     * 时间权重（0.0-1.0）
     */
    private Float timeWeight = 0.3f;

    /**
     * 热度权重（浏览量、点赞数等）（0.0-1.0）
     */
    private Float popularityWeight = 0.4f;

    /**
     * 匹配度权重（BM25评分）（0.0-1.0）
     */
    private Float relevanceWeight = 0.3f;

    /**
     * 是否降序排列（true=降序，false=升序）
     */
    private Boolean descending = true;

    /**
     * 时间衰减参数（天数）
     */
    private Integer timeDecayDays = 30;

    /**
     * 默认配置
     */
    public static SearchSortConfig defaultConfig() {
        SearchSortConfig config = new SearchSortConfig();
        config.setTimeWeight(0.3f);
        config.setPopularityWeight(0.4f);
        config.setRelevanceWeight(0.3f);
        config.setDescending(true);
        config.setTimeDecayDays(30);
        return config;
    }

    /**
     * 热度优先配置
     */
    public static SearchSortConfig popularityFirst() {
        SearchSortConfig config = new SearchSortConfig();
        config.setTimeWeight(0.1f);
        config.setPopularityWeight(0.7f);
        config.setRelevanceWeight(0.2f);
        config.setDescending(true);
        config.setTimeDecayDays(7);
        return config;
    }

    /**
     * 相关性优先配置
     */
    public static SearchSortConfig relevanceFirst() {
        SearchSortConfig config = new SearchSortConfig();
        config.setTimeWeight(0.1f);
        config.setPopularityWeight(0.1f);
        config.setRelevanceWeight(0.8f);
        config.setDescending(true);
        config.setTimeDecayDays(90);
        return config;
    }

    /**
     * 最新优先配置
     */
    public static SearchSortConfig newestFirst() {
        SearchSortConfig config = new SearchSortConfig();
        config.setTimeWeight(0.8f);
        config.setPopularityWeight(0.1f);
        config.setRelevanceWeight(0.1f);
        config.setDescending(true);
        config.setTimeDecayDays(7);
        return config;
    }

    /**
     * 验证权重配置是否合法
     */
    public boolean isValid() {
        float totalWeight = (timeWeight != null ? timeWeight : 0) +
                          (popularityWeight != null ? popularityWeight : 0) +
                          (relevanceWeight != null ? relevanceWeight : 0);
        return totalWeight > 0 && totalWeight <= 1.0f;
    }
}