package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * AI使用Top用户视图
 */
@Data
public class AiUsageUserVO {
    private Long userId;
    private String username;
    private Integer requestCount;
    private Integer tokenCount;
}
