package com.ryan.myblog.service;

import java.time.LocalDateTime;

/**
 * 分布式缓存一致性服务接口
 */
public interface CacheConsistencyService {
    
    /**
     * 获取缓存版本
     */
    Long getCacheVersion(String key);
    
    /**
     * 更新缓存版本
     */
    void updateCacheVersion(String key);
    
    /**
     * 检查缓存是否有效
     */
    boolean isCacheValid(String key, Long version);
    
    /**
     * 发布缓存失效通知
     */
    void publishCacheInvalidation(String pattern, String reason);
    
    /**
     * 订阅缓存失效通知
     */
    void subscribeCacheInvalidation();
    
    /**
     * 获取缓存最后更新时间
     */
    LocalDateTime getCacheLastUpdateTime(String key);
    
    /**
     * 设置缓存最后更新时间
     */
    void setCacheLastUpdateTime(String key, LocalDateTime updateTime);
    
    /**
     * 批量失效缓存
     */
    void batchInvalidateCache(String[] patterns, String reason);
    
    /**
     * 获取缓存一致性统计信息
     */
    CacheConsistencyStats getCacheConsistencyStats();
    
    /**
     * 缓存一致性统计信息
     */
    class CacheConsistencyStats {
        private long totalVersionUpdates;
        private long totalInvalidations;
        private long totalConsistencyChecks;
        private double cacheHitRate;
        private LocalDateTime lastStatsUpdate;

        // getters and setters
        public long getTotalVersionUpdates() { return totalVersionUpdates; }
        public void setTotalVersionUpdates(long totalVersionUpdates) { this.totalVersionUpdates = totalVersionUpdates; }
        
        public long getTotalInvalidations() { return totalInvalidations; }
        public void setTotalInvalidations(long totalInvalidations) { this.totalInvalidations = totalInvalidations; }
        
        public long getTotalConsistencyChecks() { return totalConsistencyChecks; }
        public void setTotalConsistencyChecks(long totalConsistencyChecks) { this.totalConsistencyChecks = totalConsistencyChecks; }
        
        public double getCacheHitRate() { return cacheHitRate; }
        public void setCacheHitRate(double cacheHitRate) { this.cacheHitRate = cacheHitRate; }
        
        public LocalDateTime getLastStatsUpdate() { return lastStatsUpdate; }
        public void setLastStatsUpdate(LocalDateTime lastStatsUpdate) { this.lastStatsUpdate = lastStatsUpdate; }
    }
}