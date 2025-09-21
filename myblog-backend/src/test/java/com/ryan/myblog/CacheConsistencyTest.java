package com.ryan.myblog;

import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.CacheService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 缓存一致性测试
 */
@SpringBootTest(properties = "spring.config.name=application")
public class CacheConsistencyTest {

    @Autowired
    private CacheConsistencyService cacheConsistencyService;

    @Autowired
    private CacheService cacheService;

    @Test
    public void testCacheVersionManagement() {
        String testKey = "test:cache:version";

        // 初始版本应该为0
        Long initialVersion = cacheConsistencyService.getCacheVersion(testKey);
        assertEquals(0L, initialVersion, "初始版本应该为0");

        // 更新版本
        cacheConsistencyService.updateCacheVersion(testKey);
        Long updatedVersion = cacheConsistencyService.getCacheVersion(testKey);
        assertEquals(1L, updatedVersion, "版本应该更新为1");

        // 再次更新版本
        cacheConsistencyService.updateCacheVersion(testKey);
        Long finalVersion = cacheConsistencyService.getCacheVersion(testKey);
        assertEquals(2L, finalVersion, "版本应该更新为2");

        System.out.println("✅ 缓存版本管理测试通过");
    }

    @Test
    public void testCacheConsistencyCheck() {
        String testKey = "test:cache:consistency";

        // 更新版本
        cacheConsistencyService.updateCacheVersion(testKey);
        Long currentVersion = cacheConsistencyService.getCacheVersion(testKey);

        // 一致性检查 - 版本匹配
        boolean isValid = cacheConsistencyService.isCacheValid(testKey, currentVersion);
        assertTrue(isValid, "版本匹配时应该返回true");

        // 一致性检查 - 版本不匹配
        boolean isInvalid = cacheConsistencyService.isCacheValid(testKey, 999L);
        assertFalse(isInvalid, "版本不匹配时应该返回false");

        System.out.println("✅ 缓存一致性检查测试通过");
    }

    @Test
    public void testCacheLastUpdateTime() {
        String testKey = "test:cache:update_time";
        LocalDateTime now = LocalDateTime.now();

        // 设置更新时间
        cacheConsistencyService.setCacheLastUpdateTime(testKey, now);

        // 获取更新时间
        LocalDateTime retrievedTime = cacheConsistencyService.getCacheLastUpdateTime(testKey);
        assertNotNull(retrievedTime, "应该能获取到更新时间");

        System.out.println("✅ 缓存更新时间测试通过");
    }

    @Test
    public void testCacheInvalidationMessage() throws InterruptedException {
        String testPattern = "test:cache:*";
        String testReason = "测试缓存失效";

        // 发布缓存失效消息
        cacheConsistencyService.publishCacheInvalidation(testPattern, testReason);

        // 等待消息处理
        TimeUnit.SECONDS.sleep(1);

        // 验证消息发布不会抛出异常
        assertDoesNotThrow(() -> {
            cacheConsistencyService.publishCacheInvalidation(testPattern, testReason);
        });

        System.out.println("✅ 缓存失效消息发布测试通过");
    }

    @Test
    public void testCacheConsistencyStats() {
        // 获取统计信息
        var stats = cacheConsistencyService.getCacheConsistencyStats();

        assertNotNull(stats, "统计信息不应该为null");
        assertTrue(stats.getTotalVersionUpdates() >= 0, "版本更新次数应该大于等于0");
        assertTrue(stats.getTotalInvalidations() >= 0, "失效次数应该大于等于0");
        assertTrue(stats.getTotalConsistencyChecks() >= 0, "一致性检查次数应该大于等于0");

        System.out.println("缓存一致性统计信息:");
        System.out.println("  版本更新次数: " + stats.getTotalVersionUpdates());
        System.out.println("  失效次数: " + stats.getTotalInvalidations());
        System.out.println("  一致性检查次数: " + stats.getTotalConsistencyChecks());
        System.out.println("  缓存命中率: " + stats.getCacheHitRate());

        System.out.println("✅ 缓存一致性统计测试通过");
    }

    @Test
    public void testBatchCacheInvalidation() {
        String[] patterns = {"test:cache:1:*", "test:cache:2:*", "test:cache:3:*"};
        String reason = "批量测试失效";

        // 批量发布缓存失效消息
        assertDoesNotThrow(() -> {
            cacheConsistencyService.batchInvalidateCache(patterns, reason);
        });

        System.out.println("✅ 批量缓存失效测试通过");
    }
}