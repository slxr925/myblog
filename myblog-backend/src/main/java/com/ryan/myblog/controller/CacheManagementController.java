package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CacheWarmupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 缓存管理控制器
 * 提供手动刷新、预热、监控等操作接口
 */
@Slf4j
@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheManagementController {
    
    private final CacheService cacheService;
    private final CacheWarmupService cacheWarmupService;
    private final CacheConsistencyService cacheConsistencyService;
    
    /**
     * 获取缓存统计信息
     */
    @GetMapping("/stats")
    public Result<Map<String, Object>> getCacheStats() {
        Map<String, Object> stats = cacheService.getCacheStats();
        return Result.success(stats);
    }
    
    /**
     * 获取缓存一致性统计信息
     */
    @GetMapping("/consistency/stats")
    public Result<CacheConsistencyService.CacheConsistencyStats> getConsistencyStats() {
        CacheConsistencyService.CacheConsistencyStats stats = cacheConsistencyService.getCacheConsistencyStats();
        return Result.success(stats);
    }
    
    /**
     * 手动清除指定键的缓存
     */
    @DeleteMapping("/key/{key}")
    public Result<Void> deleteCacheByKey(@PathVariable String key) {
        cacheService.delete(key);
        return Result.success();
    }
    
    /**
     * 根据模式清除缓存
     */
    @DeleteMapping("/pattern/{pattern}")
    public Result<Void> deleteCacheByPattern(@PathVariable String pattern) {
        cacheService.deleteByPattern(pattern);
        return Result.success();
    }
    
    /**
     * 清除所有缓存
     */
    @DeleteMapping("/clear")
    public Result<Void> clearAllCache() {
        cacheService.clear();
        return Result.success();
    }
    
    /**
     * 手动触发缓存预热
     */
    @PostMapping("/warmup")
    public Result<String> warmupCache() {
        try {
            cacheWarmupService.warmupAllCaches();
            return Result.success("缓存预热任务已启动");
        } catch (Exception e) {
            log.error("缓存预热失败", e);
            return Result.error("缓存预热失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取预热进度
     */
    @GetMapping("/warmup/progress")
    public Result<String> getWarmupProgress() {
        if (cacheWarmupService.isWarmupCompleted()) {
            return Result.success("预热已完成");
        } else {
            return Result.success("预热中: " + cacheWarmupService.getWarmupProgress());
        }
    }
    
    /**
     * 发布缓存失效通知
     */
    @PostMapping("/invalidation")
    public Result<Void> publishCacheInvalidation(
            @RequestParam String pattern,
            @RequestParam String reason) {
        cacheConsistencyService.publishCacheInvalidation(pattern, reason);
        return Result.success();
    }
    
    /**
     * 批量失效缓存
     */
    @PostMapping("/invalidation/batch")
    public Result<Void> batchInvalidateCache(@RequestBody String[] patterns,
                                           @RequestParam String reason) {
        cacheConsistencyService.batchInvalidateCache(patterns, reason);
        return Result.success();
    }
    
    /**
     * 获取缓存版本
     */
    @GetMapping("/version/{key}")
    public Result<Long> getCacheVersion(@PathVariable String key) {
        Long version = cacheConsistencyService.getCacheVersion(key);
        return Result.success(version);
    }
    
    /**
     * 更新缓存版本
     */
    @PostMapping("/version/{key}")
    public Result<Void> updateCacheVersion(@PathVariable String key) {
        cacheConsistencyService.updateCacheVersion(key);
        return Result.success();
    }
}