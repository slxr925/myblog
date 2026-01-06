package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 系统监控指标 VO
 */
@Data
public class SystemMetricsVO {
    // JVM
    private Long jvmMemoryUsed;
    private Long jvmMemoryMax;
    private Double jvmMemoryUsagePercentage;
    private Integer jvmThreadCount;
    private Long jvmGcCount;
    private Double jvmGcTime;

    // 系统
    private Double cpuUsage;
    private Double systemLoadAverage;

    // 数据库
    private Integer dbConnectionActive;
    private Integer dbConnectionIdle;
    private Integer dbConnectionMax;

    // Redis
    private Integer redisConnections;
    private Long redisMemoryUsed;
}
