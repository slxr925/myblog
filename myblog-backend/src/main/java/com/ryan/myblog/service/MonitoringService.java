package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.*;

/**
 * 监控服务接口
 */
public interface MonitoringService {
    /**
     * 获取系统指标
     */
    SystemMetricsVO getSystemMetrics();

    /**
     * 获取性能指标
     */
    PerformanceMetricsVO getPerformanceMetrics();

    /**
     * 获取业务指标
     */
    BusinessMetricsVO getBusinessMetrics();

    /**
     * 获取完整监控仪表盘数据
     */
    MonitoringDashboardVO getDashboard();
}
