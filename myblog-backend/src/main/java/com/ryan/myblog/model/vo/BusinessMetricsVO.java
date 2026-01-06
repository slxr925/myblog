package com.ryan.myblog.model.vo;

import lombok.Data;
import java.util.List;

/**
 * 业务监控指标 VO
 */
@Data
public class BusinessMetricsVO {
    private ContentMetrics content;
    private UserActivityMetrics userActivity;
    private InteractionMetrics interaction;
    private List<PopularBlog> topBlogs;
    private List<PopularTag> topTags;
    private NotificationMetrics notification;

    @Data
    public static class ContentMetrics {
        private Long draftCount;
        private Long publishedToday;
        private Long totalPublished;
        private Double avgWordCount;
        private Double publishRate;
    }

    @Data
    public static class UserActivityMetrics {
        private Long dailyActiveUsers;
        private Long weeklyActiveUsers;
        private Long monthlyActiveUsers;
        private Double retentionRate7d;
        private Long onlineNow;
    }

    @Data
    public static class InteractionMetrics {
        private Double commentRate;
        private Double avgLikesPerBlog;
        private Double engagementRate;
        private Long totalInteractions;
    }

    @Data
    public static class PopularBlog {
        private Long id;
        private String title;
        private Long viewCount;
        private Long likeCount;
        private Long commentCount;
    }

    @Data
    public static class PopularTag {
        private String name;
        private Long usageCount;
        private Double percentage;
    }

    @Data
    public static class NotificationMetrics {
        private Long unreadCount;
        private Long sentToday;
        private Double openRate;
        private Long kafkaBacklog;
    }
}
