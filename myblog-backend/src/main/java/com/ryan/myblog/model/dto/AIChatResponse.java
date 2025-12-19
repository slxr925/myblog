package com.ryan.myblog.model.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * AI聊天响应DTO
 */
@Data
@Builder
public class AIChatResponse {
    /**
     * AI回答
     */
    private String answer;

    /**
     * 对话ID
     */
    private String conversationId;

    /**
     * 是否使用了AI（false表示使用降级策略）
     */
    private Boolean aiEnabled;

    /**
     * 响应时间（毫秒）
     */
    private Long responseTime;

    /**
     * 相关文章列表
     */
    private List<RelatedArticle> relatedArticles;

    /**
     * 相关文章信息
     */
    @Data
    @Builder
    public static class RelatedArticle {
        private Long id;
        private String title;
    }
}
