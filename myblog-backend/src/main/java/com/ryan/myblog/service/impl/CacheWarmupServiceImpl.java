package com.ryan.myblog.service.impl;

import com.ryan.myblog.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 缓存预热服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Order(1) // 确保在其他组件之前执行
public class CacheWarmupServiceImpl implements CacheWarmupService, ApplicationRunner {
    
    private final CategoryService categoryService;
    private final TagService tagService;
    private final BlogService blogService;
    private final CacheService cacheService;
    
    private final AtomicBoolean warmupCompleted = new AtomicBoolean(false);
    private final AtomicInteger warmupProgress = new AtomicInteger(0);
    private final AtomicInteger totalTasks = new AtomicInteger(5);
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("开始缓存预热...");
        warmupAllCaches();
    }
    
    @Override
    public void warmupAllCaches() {
        warmupCompleted.set(false);
        warmupProgress.set(0);
        
        // 异步执行预热任务
        CompletableFuture.allOf(
            CompletableFuture.runAsync(this::warmupCategoryCache),
            CompletableFuture.runAsync(this::warmupTagCache),
            CompletableFuture.runAsync(this::warmupHotBlogCache),
            CompletableFuture.runAsync(this::warmupLatestBlogCache),
            CompletableFuture.runAsync(this::warmupUserCache)
        ).whenComplete((result, throwable) -> {
            if (throwable != null) {
                log.error("缓存预热失败", throwable);
            } else {
                warmupCompleted.set(true);
                log.info("缓存预热完成");
            }
        });
    }
    
    @Override
    public void warmupCategoryCache() {
        try {
            log.debug("开始预热分类缓存...");
            categoryService.getAllCategories();
            warmupProgress.incrementAndGet();
            log.debug("分类缓存预热完成");
        } catch (Exception e) {
            log.error("分类缓存预热失败", e);
        }
    }
    
    @Override
    public void warmupTagCache() {
        try {
            log.debug("开始预热标签缓存...");
            tagService.getAllTags();
            warmupProgress.incrementAndGet();
            log.debug("标签缓存预热完成");
        } catch (Exception e) {
            log.error("标签缓存预热失败", e);
        }
    }
    
    @Override
    public void warmupHotBlogCache() {
        try {
            log.debug("开始预热热门博客缓存...");
            // 预热不同数量的热门博客
            int[] limits = {5, 10, 20};
            for (int limit : limits) {
                blogService.getHotBlogs(limit);
            }
            warmupProgress.incrementAndGet();
            log.debug("热门博客缓存预热完成");
        } catch (Exception e) {
            log.error("热门博客缓存预热失败", e);
        }
    }
    
    @Override
    public void warmupLatestBlogCache() {
        try {
            log.debug("开始预热最新博客缓存...");
            // 预热不同数量的最新博客
            int[] limits = {5, 10, 20};
            for (int limit : limits) {
                blogService.getLatestBlogs(limit);
            }
            warmupProgress.incrementAndGet();
            log.debug("最新博客缓存预热完成");
        } catch (Exception e) {
            log.error("最新博客缓存预热失败", e);
        }
    }
    
    @Override
    public void warmupUserCache() {
        try {
            log.debug("开始预热用户缓存...");
            // 这里可以预热一些常用的用户数据
            // 例如管理员用户等
            warmupProgress.incrementAndGet();
            log.debug("用户缓存预热完成");
        } catch (Exception e) {
            log.error("用户缓存预热失败", e);
        }
    }
    
    @Override
    public boolean isWarmupCompleted() {
        return warmupCompleted.get();
    }
    
    @Override
    public String getWarmupProgress() {
        int current = warmupProgress.get();
        int total = totalTasks.get();
        double percentage = total > 0 ? (double) current / total * 100 : 0;
        return String.format("%.1f%% (%d/%d)", percentage, current, total);
    }
}