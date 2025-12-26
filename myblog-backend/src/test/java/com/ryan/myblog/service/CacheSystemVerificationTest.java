package com.ryan.myblog.service;

import com.ryan.myblog.common.RedisKeyFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class CacheSystemVerificationTest {

    @Autowired
    private UnifiedCacheService unifiedCacheService;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    public void testRedisKeyFactoryDefinitions() {
        // 1. Verify Key Generation
        String blogDetailKey = RedisKeyFactory.BLOG_DETAIL.getKey(123L);
        assertEquals("blog:detail:123", blogDetailKey, "BLOG_DETAIL key format incorrect");

        // 2. Verify TTL
        long ttl = RedisKeyFactory.BLOG_DETAIL.getExpire();
        assertEquals(30, ttl, "BLOG_DETAIL TTL incorrect");
        assertEquals(TimeUnit.MINUTES, RedisKeyFactory.BLOG_DETAIL.getTimeUnit(), "BLOG_DETAIL TimeUnit incorrect");

        // Verify new keys
        assertEquals("blog:view:456", RedisKeyFactory.BLOG_VIEW.getKey(456L), "BLOG_VIEW key format incorrect");
        assertEquals("user:token:abc", RedisKeyFactory.USER_TOKEN.getKey("abc"), "USER_TOKEN key format incorrect");
    }

    @Test
    public void testUnifiedCacheServiceBasicOps() {
        String testKey = "test:verification:key";
        String testValue = "verification-value";

        // 1. Set
        unifiedCacheService.set(testKey, testValue, 60);

        // 2. Get
        String retrieved = unifiedCacheService.get(testKey, String.class);
        assertEquals(testValue, retrieved, "UnifiedCacheService GET failed");

        // 3. Delete
        unifiedCacheService.delete(testKey);
        String afterDelete = unifiedCacheService.get(testKey, String.class);
        assertNull(afterDelete, "UnifiedCacheService DELETE failed");
    }
}
