package com.ryan.myblog.service.impl;

import com.ryan.myblog.arthas.ArthasApiClient;
import com.ryan.myblog.model.vo.*;
import com.ryan.myblog.service.ArthasMonitoringService;
import com.ryan.myblog.service.MonitoringService;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.lang.management.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Arthas监控服务实现
 * 使用Java Management API + Micrometer 提供增强的监控能力
 * 注：完整Arthas功能需要Arthas Agent运行时支持
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ArthasMonitoringServiceImpl implements ArthasMonitoringService {

    private final ArthasApiClient arthasApiClient;
    private final MonitoringService monitoringService;
    private final MeterRegistry meterRegistry;

    @Override
    public ArthasMonitoringVO getMonitoringDashboard() {
        ArthasMonitoringVO dashboard = new ArthasMonitoringVO();
        dashboard.setArthasMetrics(getArthasSystemMetrics());
        dashboard.setPerformanceMetrics(monitoringService.getPerformanceMetrics());
        dashboard.setBusinessMetrics(monitoringService.getBusinessMetrics());
        dashboard.setTimestamp(System.currentTimeMillis());
        return dashboard;
    }

    @Override
    public ArthasSystemMetricsVO getArthasSystemMetrics() {
        ArthasSystemMetricsVO metrics = new ArthasSystemMetricsVO();

        try {
            // JVM内存信息
            MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
            MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
            MemoryUsage nonHeapUsage = memoryMXBean.getNonHeapMemoryUsage();

            // 堆内存
            metrics.setJvmMemoryUsed(heapUsage.getUsed());
            metrics.setJvmMemoryMax(heapUsage.getMax());
            if (heapUsage.getMax() > 0) {
                metrics.setJvmMemoryUsagePercentage((double) heapUsage.getUsed() / heapUsage.getMax() * 100);
            }

            // 堆内存详情
            ArthasSystemMetricsVO.MemoryDetail heapDetail = new ArthasSystemMetricsVO.MemoryDetail();
            heapDetail.setUsed(heapUsage.getUsed());
            heapDetail.setMax(heapUsage.getMax());
            heapDetail.setCommitted(heapUsage.getCommitted());
            heapDetail.setUsagePercentage((double) heapUsage.getUsed() / heapUsage.getMax() * 100);
            metrics.setHeapMemory(heapDetail);

            // 非堆内存详情
            ArthasSystemMetricsVO.MemoryDetail nonHeapDetail = new ArthasSystemMetricsVO.MemoryDetail();
            nonHeapDetail.setUsed(nonHeapUsage.getUsed());
            nonHeapDetail.setMax(nonHeapUsage.getMax() > 0 ? nonHeapUsage.getMax() : -1L);
            nonHeapDetail.setCommitted(nonHeapUsage.getCommitted());
            if (nonHeapUsage.getMax() > 0) {
                nonHeapDetail.setUsagePercentage((double) nonHeapUsage.getUsed() / nonHeapUsage.getMax() * 100);
            }
            metrics.setNonHeapMemory(nonHeapDetail);

            // Metaspace (通过MXBean获取)
            for (MemoryPoolMXBean pool : ManagementFactory.getMemoryPoolMXBeans()) {
                if (pool.getName().contains("Metaspace")) {
                    MemoryUsage usage = pool.getUsage();
                    ArthasSystemMetricsVO.MemoryDetail metaspaceDetail = new ArthasSystemMetricsVO.MemoryDetail();
                    metaspaceDetail.setUsed(usage.getUsed());
                    metaspaceDetail.setMax(usage.getMax() > 0 ? usage.getMax() : -1L);
                    metaspaceDetail.setCommitted(usage.getCommitted());
                    if (usage.getMax() > 0) {
                        metaspaceDetail.setUsagePercentage((double) usage.getUsed() / usage.getMax() * 100);
                    }
                    metrics.setMetaspace(metaspaceDetail);
                    break;
                }
            }

            // 线程信息
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
            metrics.setJvmThreadCount(threadMXBean.getThreadCount());
            metrics.setActiveThreadCount(threadMXBean.getThreadCount()); // 简化：活跃线程数
            metrics.setDaemonThreadCount(threadMXBean.getDaemonThreadCount());
            metrics.setPeakThreadCount(threadMXBean.getPeakThreadCount());

            // GC信息
            long totalGcCount = 0;
            long totalGcTime = 0;
            List<GarbageCollectorMXBean> gcBeans = ManagementFactory.getGarbageCollectorMXBeans();

            for (GarbageCollectorMXBean gc : gcBeans) {
                totalGcCount += gc.getCollectionCount();
                totalGcTime += gc.getCollectionTime();

                // 区分Young GC和Old GC
                if (gc.getName().contains("Young") || gc.getName().contains("Scavenge")) {
                    ArthasSystemMetricsVO.GcDetail youngGc = new ArthasSystemMetricsVO.GcDetail();
                    youngGc.setName(gc.getName());
                    youngGc.setCount(gc.getCollectionCount());
                    youngGc.setTime(gc.getCollectionTime());
                    metrics.setYoungGc(youngGc);
                } else if (gc.getName().contains("Old") || gc.getName().contains("MarkSweep")) {
                    ArthasSystemMetricsVO.GcDetail oldGc = new ArthasSystemMetricsVO.GcDetail();
                    oldGc.setName(gc.getName());
                    oldGc.setCount(gc.getCollectionCount());
                    oldGc.setTime(gc.getCollectionTime());
                    metrics.setOldGc(oldGc);
                }
            }

            metrics.setJvmGcCount(totalGcCount);
            metrics.setJvmGcTime(totalGcTime);

            // CPU信息
            Gauge cpuGauge = meterRegistry.find("system.cpu.usage").gauge();
            if (cpuGauge != null) {
                metrics.setCpuUsage(cpuGauge.value() * 100);
            }

            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            metrics.setSystemLoadAverage(osBean.getSystemLoadAverage());
            metrics.setAvailableProcessors(osBean.getAvailableProcessors());

            // 运行时信息
            RuntimeMXBean runtimeMXBean = ManagementFactory.getRuntimeMXBean();
            metrics.setJavaVersion(System.getProperty("java.version"));
            metrics.setJvmVersion(runtimeMXBean.getVmName() + " " + runtimeMXBean.getVmVersion());
            metrics.setUptime(runtimeMXBean.getUptime());
            metrics.setStartTime(runtimeMXBean.getStartTime());

            // 类加载信息
            ClassLoadingMXBean classLoadingMXBean = ManagementFactory.getClassLoadingMXBean();
            metrics.setLoadedClassCount((long) classLoadingMXBean.getLoadedClassCount());
            metrics.setTotalLoadedClassCount(classLoadingMXBean.getTotalLoadedClassCount());
            metrics.setUnloadedClassCount(classLoadingMXBean.getUnloadedClassCount());

        } catch (Exception e) {
            log.error("获取Arthas系统指标失败", e);
        }

        return metrics;
    }

    @Override
    public ArthasThreadAnalysisVO getThreadAnalysis() {
        ArthasThreadAnalysisVO analysis = new ArthasThreadAnalysisVO();

        try {
            ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();

            // 线程概况
            analysis.setTotalThreads(threadMXBean.getThreadCount());
            analysis.setActiveThreads(threadMXBean.getThreadCount());
            analysis.setDaemonThreads(threadMXBean.getDaemonThreadCount());
            analysis.setPeakThreads(threadMXBean.getPeakThreadCount());

            // 获取所有线程信息
            long[] threadIds = threadMXBean.getAllThreadIds();
            ThreadInfo[] threadInfos = threadMXBean.getThreadInfo(threadIds, Integer.MAX_VALUE);

            List<ArthasThreadAnalysisVO.ThreadInfo> hotThreads = new ArrayList<>();
            List<ArthasThreadAnalysisVO.ThreadInfo> blockedThreads = new ArrayList<>();

            // 线程状态分布计数器
            int runnable = 0, blocked = 0, waiting = 0, timedWaiting = 0, terminated = 0;

            for (ThreadInfo info : threadInfos) {
                if (info == null)
                    continue;

                // 统计状态分布
                switch (info.getThreadState()) {
                    case NEW -> {
                    } // 新建状态线程,罕见
                    case RUNNABLE -> runnable++;
                    case BLOCKED -> {
                        blocked++;
                        // 收集阻塞线程
                        if (blockedThreads.size() < 10) { // 限制返回数量
                            ArthasThreadAnalysisVO.ThreadInfo ti = createThreadInfo(info, threadMXBean);
                            blockedThreads.add(ti);
                        }
                    }
                    case WAITING -> waiting++;
                    case TIMED_WAITING -> timedWaiting++;
                    case TERMINATED -> terminated++;
                    default -> log.warn("Unknown thread state: {}", info.getThreadState());
                }

                // 收集热点线程（简化：按线程ID排序，实际应该按CPU时间排序）
                if (hotThreads.size() < 10 && info.getThreadState() == Thread.State.RUNNABLE) {
                    ArthasThreadAnalysisVO.ThreadInfo ti = createThreadInfo(info, threadMXBean);
                    hotThreads.add(ti);
                }
            }

            analysis.setHotThreads(hotThreads);
            analysis.setBlockedThreads(blockedThreads);

            // 设置状态分布
            ArthasThreadAnalysisVO.ThreadStateDistribution distribution = new ArthasThreadAnalysisVO.ThreadStateDistribution();
            distribution.setRunnable(runnable);
            distribution.setBlocked(blocked);
            distribution.setWaiting(waiting);
            distribution.setTimedWaiting(timedWaiting);
            distribution.setTerminated(terminated);
            analysis.setStateDistribution(distribution);

        } catch (Exception e) {
            log.error("获取线程分析数据失败", e);
        }

        return analysis;
    }

    /**
     * 创建线程信息对象
     */
    private ArthasThreadAnalysisVO.ThreadInfo createThreadInfo(ThreadInfo threadInfo, ThreadMXBean threadMXBean) {
        ArthasThreadAnalysisVO.ThreadInfo ti = new ArthasThreadAnalysisVO.ThreadInfo();
        ti.setId(threadInfo.getThreadId());
        ti.setName(threadInfo.getThreadName());
        ti.setState(threadInfo.getThreadState().name());
        ti.setDaemon(false); // ThreadInfo不直接提供daemon信息
        ti.setPriority(5); // 默认优先级

        // 尝试获取CPU时间（需要启用-XX:+ManagementServer或类似选项）
        if (threadMXBean.isThreadCpuTimeSupported() && threadMXBean.isThreadCpuTimeEnabled()) {
            long cpuTime = threadMXBean.getThreadCpuTime(threadInfo.getThreadId());
            ti.setCpuTime(cpuTime);
            ti.setCpuUsage(0.0); // 简化：CPU使用率需要定期采样计算
        }

        return ti;
    }

    @Override
    public boolean isArthasHealthy() {
        try {
            // 简化的健康检查：验证JMX可用
            ManagementFactory.getRuntimeMXBean();
            return true;
        } catch (Exception e) {
            log.error("Arthas健康检查失败", e);
            return false;
        }
    }
}
