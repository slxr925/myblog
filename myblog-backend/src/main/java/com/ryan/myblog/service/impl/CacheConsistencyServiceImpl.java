package com.ryan.myblog.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.CacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.concurrent.atomic.AtomicLong;

/**
 * 分布式缓存一致性服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheConsistencyServiceImpl implements CacheConsistencyService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheService cacheService;
    private final RedisMessageListenerContainer messageListenerContainer;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private static final String VERSION_KEY_PREFIX = "cache:version:";
    private static final String UPDATE_TIME_KEY_PREFIX = "cache:update_time:";
    private static final String INVALIDATION_CHANNEL = "cache:invalidation";
    private static final String STATS_KEY = "cache:consistency:stats";
    
    // 统计计数器
    private final AtomicLong versionUpdates = new AtomicLong(0);
    private final AtomicLong invalidations = new AtomicLong(0);
    private final AtomicLong consistencyChecks = new AtomicLong(0);
    
    @PostConstruct
    public void init() {
        subscribeCacheInvalidation();
    }
    
    @Override
    public Long getCacheVersion(String key) {
        try {
            String versionKey = VERSION_KEY_PREFIX + key;
            Long version = cacheService.get(versionKey, Long.class);
            return version != null ? version : 0L;
        } catch (Exception e) {
            log.error("获取缓存版本失败: key={}, error={}", key, e.getMessage());
            return 0L;
        }
    }
    
    @Override
    public void updateCacheVersion(String key) {
        try {
            String versionKey = VERSION_KEY_PREFIX + key;
            Long currentVersion = getCacheVersion(key);
            Long newVersion = currentVersion + 1;
            
            cacheService.set(versionKey, newVersion, 86400); // 版本信息保存24小时
            setCacheLastUpdateTime(key, LocalDateTime.now());
            
            versionUpdates.incrementAndGet();
            log.debug("缓存版本更新: key={}, version={}", key, newVersion);
        } catch (Exception e) {
            log.error("更新缓存版本失败: key={}, error={}", key, e.getMessage());
        }
    }
    
    @Override
    public boolean isCacheValid(String key, Long version) {
        try {
            consistencyChecks.incrementAndGet();
            Long currentVersion = getCacheVersion(key);
            boolean isValid = version != null && version.equals(currentVersion);
            log.debug("缓存一致性检查: key={}, clientVersion={}, serverVersion={}, valid={}", 
                     key, version, currentVersion, isValid);
            return isValid;
        } catch (Exception e) {
            log.error("缓存一致性检查失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }
    
    @Override
    public void publishCacheInvalidation(String pattern, String reason) {
        try {
            CacheInvalidationMessage message = new CacheInvalidationMessage();
            message.setPattern(pattern);
            message.setReason(reason);
            message.setTimestamp(LocalDateTime.now());
            message.setSource(getInstanceId());
            
            String messageJson = objectMapper.writeValueAsString(message);
            redisTemplate.convertAndSend(INVALIDATION_CHANNEL, messageJson);
            
            invalidations.incrementAndGet();
            log.info("发布缓存失效通知: pattern={}, reason={}", pattern, reason);
        } catch (Exception e) {
            log.error("发布缓存失效通知失败: pattern={}, error={}", pattern, e.getMessage());
        }
    }
    
    @Override
    public void subscribeCacheInvalidation() {
        try {
            messageListenerContainer.addMessageListener((message, pattern) -> {
                try {
                    String messageBody = new String(message.getBody());
                    CacheInvalidationMessage invalidationMessage = 
                        objectMapper.readValue(messageBody, CacheInvalidationMessage.class);
                    
                    // 忽略自己发送的消息
                    if (!getInstanceId().equals(invalidationMessage.getSource())) {
                        handleCacheInvalidation(invalidationMessage);
                    }
                } catch (Exception e) {
                    log.error("处理缓存失效通知失败: error={}", e.getMessage());
                }
            }, new PatternTopic(INVALIDATION_CHANNEL));
            
            log.info("缓存失效通知订阅成功");
        } catch (Exception e) {
            log.error("订阅缓存失效通知失败: error={}", e.getMessage());
        }
    }
    
    @Override
    public LocalDateTime getCacheLastUpdateTime(String key) {
        try {
            String updateTimeKey = UPDATE_TIME_KEY_PREFIX + key;
            return cacheService.get(updateTimeKey, LocalDateTime.class);
        } catch (Exception e) {
            log.error("获取缓存更新时间失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }
    
    @Override
    public void setCacheLastUpdateTime(String key, LocalDateTime updateTime) {
        try {
            String updateTimeKey = UPDATE_TIME_KEY_PREFIX + key;
            cacheService.set(updateTimeKey, updateTime, 86400); // 保存24小时
        } catch (Exception e) {
            log.error("设置缓存更新时间失败: key={}, error={}", key, e.getMessage());
        }
    }
    
    @Override
    public void batchInvalidateCache(String[] patterns, String reason) {
        for (String pattern : patterns) {
            publishCacheInvalidation(pattern, reason);
        }
    }
    
    @Override
    public CacheConsistencyStats getCacheConsistencyStats() {
        CacheConsistencyStats stats = new CacheConsistencyStats();
        stats.setTotalVersionUpdates(versionUpdates.get());
        stats.setTotalInvalidations(invalidations.get());
        stats.setTotalConsistencyChecks(consistencyChecks.get());
        stats.setLastStatsUpdate(LocalDateTime.now());
        
        // 计算缓存命中率（简化计算）
        long totalChecks = consistencyChecks.get();
        if (totalChecks > 0) {
            stats.setCacheHitRate(1.0 - (double) invalidations.get() / totalChecks);
        }
        
        return stats;
    }
    
    /**
     * 处理缓存失效通知
     */
    private void handleCacheInvalidation(CacheInvalidationMessage message) {
        try {
            log.info("收到缓存失效通知: pattern={}, reason={}, source={}", 
                    message.getPattern(), message.getReason(), message.getSource());
            
            // 删除匹配的缓存
            cacheService.deleteByPattern(message.getPattern());
            
            // 更新相关缓存版本
            updateCacheVersion(message.getPattern());
            
        } catch (Exception e) {
            log.error("处理缓存失效通知失败: error={}", e.getMessage());
        }
    }
    
    /**
     * 获取实例ID
     */
    private String getInstanceId() {
        // 可以使用机器名、IP、进程ID等唯一标识
        return System.getProperty("user.name") + "@" + 
               System.getProperty("java.vm.name") + ":" + 
               ProcessHandle.current().pid();
    }
    
    /**
     * 缓存失效消息
     */
    public static class CacheInvalidationMessage {
        private String pattern;
        private String reason;
        private LocalDateTime timestamp;
        private String source;
        
        // getters and setters
        public String getPattern() { return pattern; }
        public void setPattern(String pattern) { this.pattern = pattern; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
    }
}