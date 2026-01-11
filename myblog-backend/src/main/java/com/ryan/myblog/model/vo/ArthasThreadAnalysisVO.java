package com.ryan.myblog.model.vo;

import lombok.Data;
import java.util.List;

/**
 * Arthas线程分析VO
 */
@Data
public class ArthasThreadAnalysisVO {

    // 线程概况
    private Integer totalThreads;
    private Integer activeThreads;
    private Integer daemonThreads;
    private Integer peakThreads;

    // 热点线程（CPU占用最高的线程）
    private List<ThreadInfo> hotThreads;

    // 阻塞线程
    private List<ThreadInfo> blockedThreads;

    // 线程状态分布
    private ThreadStateDistribution stateDistribution;

    @Data
    public static class ThreadInfo {
        private Long id;
        private String name;
        private String state;
        private Double cpuUsage;
        private Long cpuTime;
        private Boolean daemon;
        private Integer priority;
        private String group;
    }

    @Data
    public static class ThreadStateDistribution {
        private Integer runnable;
        private Integer blocked;
        private Integer waiting;
        private Integer timedWaiting;
        private Integer terminated;
    }
}
