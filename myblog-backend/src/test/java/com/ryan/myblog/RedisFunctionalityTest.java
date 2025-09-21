package com.ryan.myblog;

import com.ryan.myblog.service.CacheService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Redis功能测试
 */
@SpringBootTest(properties = "spring.config.name=application")
@TestPropertySource(properties = {
    "spring.redis.host=localhost",
    "spring.redis.port=6379",
    "spring.redis.database=0"
})
public class RedisFunctionalityTest {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private CacheService cacheService;

    @Test
    public void testRedisConnection() {
        // 测试基本Redis连接
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            System.out.println("✅ Redis连接成功");
        } catch (Exception e) {
            fail("Redis连接失败: " + e.getMessage());
        }
    }

    @Test
    public void testBasicRedisOperations() {
        // 测试基本的Redis操作
        String testKey = "test:basic:redis";
        String testValue = "Hello Redis!";

        // 设置值
        redisTemplate.opsForValue().set(testKey, testValue);

        // 获取值
        Object retrievedValue = redisTemplate.opsForValue().get(testKey);
        assertEquals(testValue, retrievedValue, "获取的值应该与设置的值相同");

        // 删除键
        Boolean deleted = redisTemplate.delete(testKey);
        assertTrue(deleted, "删除操作应该成功");

        // 验证删除
        Object afterDelete = redisTemplate.opsForValue().get(testKey);
        assertNull(afterDelete, "删除后应该获取不到值");

        System.out.println("✅ 基本Redis操作测试通过");
    }

    @Test
    public void testCacheServiceOperations() {
        // 测试缓存服务
        String cacheKey = "test:cache:service";
        String cacheValue = "测试缓存服务";

        // 设置缓存
        cacheService.set(cacheKey, cacheValue);

        // 获取缓存
        String retrievedValue = cacheService.get(cacheKey, String.class);
        assertEquals(cacheValue, retrievedValue, "缓存服务应该正常工作");

        // 测试带过期时间的缓存
        String expireKey = "test:expire:key";
        String expireValue = "测试过期缓存";
        cacheService.set(expireKey, expireValue, 2); // 2秒过期

        // 立即获取
        String immediateValue = cacheService.get(expireKey, String.class);
        assertEquals(expireValue, immediateValue, "应该能立即获取到值");

        // 等待过期
        try {
            Thread.sleep(2500); // 等待2.5秒
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // 过期后获取
        String afterExpire = cacheService.get(expireKey, String.class);
        assertNull(afterExpire, "过期后应该获取不到值");

        System.out.println("✅ 缓存服务操作测试通过");
    }

    @Test
    public void testHashOperations() {
        // 测试Hash操作
        String hashKey = "test:hash:operations";
        String field1 = "field1";
        String field2 = "field2";
        String value1 = "value1";
        String value2 = "value2";

        // 设置Hash字段
        redisTemplate.opsForHash().put(hashKey, field1, value1);
        redisTemplate.opsForHash().put(hashKey, field2, value2);

        // 获取Hash字段
        Object retrievedValue1 = redisTemplate.opsForHash().get(hashKey, field1);
        Object retrievedValue2 = redisTemplate.opsForHash().get(hashKey, field2);

        assertEquals(value1, retrievedValue1, "Hash字段1应该正确");
        assertEquals(value2, retrievedValue2, "Hash字段2应该正确");

        // 获取所有Hash字段
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(hashKey);
        assertEquals(2, entries.size(), "Hash应该包含2个字段");
        assertEquals(value1, entries.get(field1));
        assertEquals(value2, entries.get(field2));

        // 清理
        redisTemplate.delete(hashKey);

        System.out.println("✅ Hash操作测试通过");
    }

    @Test
    public void testListOperations() {
        // 测试List操作
        String listKey = "test:list:operations";
        String item1 = "item1";
        String item2 = "item2";
        String item3 = "item3";

        // 添加元素到列表
        redisTemplate.opsForList().rightPush(listKey, item1);
        redisTemplate.opsForList().rightPush(listKey, item2);
        redisTemplate.opsForList().rightPush(listKey, item3);

        // 获取列表长度
        Long size = redisTemplate.opsForList().size(listKey);
        assertEquals(3L, size, "列表长度应该是3");

        // 获取列表元素
        List<Object> range = redisTemplate.opsForList().range(listKey, 0, -1);
        assertEquals(3, range.size(), "应该获取到3个元素");
        assertEquals(item1, range.get(0));
        assertEquals(item2, range.get(1));
        assertEquals(item3, range.get(2));

        // 清理
        redisTemplate.delete(listKey);

        System.out.println("✅ List操作测试通过");
    }

    @Test
    public void testSetOperations() {
        // 测试Set操作
        String setKey = "test:set:operations";
        String member1 = "member1";
        String member2 = "member2";
        String member3 = "member3";

        // 添加成员到集合
        redisTemplate.opsForSet().add(setKey, member1, member2, member3);

        // 获取集合大小
        Long size = redisTemplate.opsForSet().size(setKey);
        assertEquals(3L, size, "集合大小应该是3");

        // 检查成员是否存在
        Boolean isMember = redisTemplate.opsForSet().isMember(setKey, member2);
        assertTrue(isMember, "成员应该在集合中");

        // 获取所有成员
        Set<Object> members = redisTemplate.opsForSet().members(setKey);
        assertNotNull(members, "成员集合不应该为null");
        assertEquals(3, members.size(), "应该获取到3个成员");
        assertTrue(members.contains(member1));
        assertTrue(members.contains(member2));
        assertTrue(members.contains(member3));

        // 清理
        redisTemplate.delete(setKey);

        System.out.println("✅ Set操作测试通过");
    }

    @Test
    public void testKeyExpiration() throws InterruptedException {
        // 测试键过期功能
        String expireKey = "test:expire:key";
        String expireValue = "测试过期功能";

        // 设置值和过期时间
        redisTemplate.opsForValue().set(expireKey, expireValue, 1, TimeUnit.SECONDS);

        // 立即获取
        Object immediateValue = redisTemplate.opsForValue().get(expireKey);
        assertEquals(expireValue, immediateValue, "应该能立即获取到值");

        // 等待过期
        Thread.sleep(1500); // 等待1.5秒

        // 过期后获取
        Object afterExpire = redisTemplate.opsForValue().get(expireKey);
        assertNull(afterExpire, "过期后应该获取不到值");

        System.out.println("✅ 键过期功能测试通过");
    }

    @Test
    public void testPatternOperations() {
        // 测试模式匹配操作
        String pattern1 = "test:pattern:1";
        String pattern2 = "test:pattern:2";
        String pattern3 = "test:other:1";

        redisTemplate.opsForValue().set(pattern1, "value1");
        redisTemplate.opsForValue().set(pattern2, "value2");
        redisTemplate.opsForValue().set(pattern3, "value3");

        // 匹配模式
        Set<String> keys = redisTemplate.keys("test:pattern:*");
        assertEquals(2, keys.size(), "应该匹配到2个键");
        assertTrue(keys.contains(pattern1));
        assertTrue(keys.contains(pattern2));

        // 清理
        redisTemplate.delete(pattern1);
        redisTemplate.delete(pattern2);
        redisTemplate.delete(pattern3);

        System.out.println("✅ 模式匹配操作测试通过");
    }

    @Test
    public void testRedisInfo() {
        // 测试Redis信息
        Properties info = redisTemplate.getConnectionFactory().getConnection().info();

        System.out.println("Redis服务器信息:");
        System.out.println("版本: " + info.getProperty("redis_version"));
        System.out.println("模式: " + info.getProperty("redis_mode"));
        System.out.println("内存使用: " + info.getProperty("used_memory_human"));
        System.out.println("连接数: " + info.getProperty("connected_clients"));

        assertNotNull(info.getProperty("redis_version"), "应该能获取Redis版本");
        assertEquals("standalone", info.getProperty("redis_mode"), "应该是独立模式");

        System.out.println("✅ Redis信息获取测试通过");
    }
}