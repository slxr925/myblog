package com.ryan.myblog.ai.tool;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagRecommendationResult {
    private Long id;
    private String name;
    private String color;
    private Boolean existing;
    private Double confidence;
    private String reason;
}
