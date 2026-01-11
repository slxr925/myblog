package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.ArthasMonitoringVO;
import com.ryan.myblog.model.vo.ArthasSystemMetricsVO;
import com.ryan.myblog.model.vo.ArthasThreadAnalysisVO;

/**
 * Arthas监控服务接口
 */
public interface ArthasMonitoringService {

    /**
     * 获取完整监控仪表盘数据（Arthas系统指标 + 性能指标 + 业务指标）
     */
    ArthasMonitoringVO getMonitoringDashboard();

    /**
     * 获取Arthas系统指标
     */
    ArthasSystemMetricsVO getArthasSystemMetrics();

    /**
     * 获取线程分析数据
     */
    ArthasThreadAnalysisVO getThreadAnalysis();

    /**
     * 健康检查：验证Arthas是否正常运行
     */
    boolean isArthasHealthy();
}
