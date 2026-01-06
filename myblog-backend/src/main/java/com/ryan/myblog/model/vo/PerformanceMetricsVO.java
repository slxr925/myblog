package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 性能监控指标 VO
 */
@Data
public class PerformanceMetricsVO {
    private Long totalRequests;
    private Double requestsPerSecond;
    private Double averageResponseTime;
    private Double p95ResponseTime;
    private Double p99ResponseTime;
    private Double errorRate;
}
