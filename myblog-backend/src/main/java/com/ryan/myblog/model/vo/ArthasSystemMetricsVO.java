package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * Arthas系统指标VO
 * 替代原有的SystemMetricsVO，使用Arthas采集的数据
 */
@Data
public class ArthasSystemMetricsVO {

    // JVM内存
    private Long jvmMemoryUsed;
    private Long jvmMemoryMax;
    private Double jvmMemoryUsagePercentage;

    // JVM详细内存信息
    private MemoryDetail heapMemory;
    private MemoryDetail nonHeapMemory;
    private MemoryDetail metaspace;

    // 线程信息
    private Integer jvmThreadCount;
    private Integer activeThreadCount;
    private Integer daemonThreadCount;
    private Integer peakThreadCount;

    // GC信息
    private Long jvmGcCount;
    private Long jvmGcTime;
    private GcDetail youngGc;
    private GcDetail oldGc;

    // CPU信息
    private Double cpuUsage;
    private Double systemLoadAverage;
    private Integer availableProcessors;

    // 系统信息
    private String javaVersion;
    private String jvmVersion;
    private Long uptime;
    private Long startTime;

    // 类加载信息
    private Long loadedClassCount;
    private Long totalLoadedClassCount;
    private Long unloadedClassCount;

    @Data
    public static class MemoryDetail {
        private Long used;
        private Long max;
        private Long committed;
        private Double usagePercentage;
    }

    @Data
    public static class GcDetail {
        private String name;
        private Long count;
        private Long time;
    }
}
