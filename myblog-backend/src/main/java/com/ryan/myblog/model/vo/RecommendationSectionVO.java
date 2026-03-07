package com.ryan.myblog.model.vo;

import lombok.Data;

import java.util.List;

/**
 * 推荐区块VO
 */
@Data
public class RecommendationSectionVO {

    private String title;
    private String source;
    private List<BlogRecommendationVO> items;
}
