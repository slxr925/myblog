package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 监控仪表盘数据 VO（汇总所有监控指标）
 */
@Data
public class MonitoringDashboardVO {
    private SystemMetricsVO system;
    private PerformanceMetricsVO performance;
    private BusinessMetricsVO business;
}
