package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * Arthas完整监控仪表盘VO
 * 包含Arthas系统指标和保留的业务指标
 */
@Data
public class ArthasMonitoringVO {

    /**
     * Arthas系统指标（JVM、CPU、线程等）
     */
    private ArthasSystemMetricsVO arthasMetrics;

    /**
     * 性能指标（QPS、响应时间、错误率）
     * 继续使用Micrometer采集
     */
    private PerformanceMetricsVO performanceMetrics;

    /**
     * 业务指标（用户活跃度、内容统计、互动数据）
     * 保留现有实现
     */
    private BusinessMetricsVO businessMetrics;

    /**
     * 数据采集时间戳
     */
    private Long timestamp;

    /**
     * 数据来源标识
     */
    private String source = "arthas-enhanced";
}
