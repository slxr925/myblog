package com.ryan.myblog.service.impl;

import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.UnifiedCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 统一缓存服务实现类
 * 
 * 基于RedisKeyFactory的统一缓存管理，确保:
 * 1. Key命名规范化
 * 2. TTL自动管理
 * 3. 类型安全
 * 4. 异常降级
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UnifiedCacheServiceImpl implements UnifiedCacheService {

    private final CacheService cacheService;
    private final RedisTemplate<String, Object> redisTemplate;

    // ==================== String 操作 ====================

    @Override
    public void set(RedisKeyFactory keyFactory, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        if (keyFactory.hasExpire()) {
            cacheService.set(key, value, keyFactory.getExpireSeconds());
        } else {
            cacheService.set(key, value);
        }
        log.debug("缓存设置: factory={}, key={}, ttl={}",
                keyFactory.name(), key, keyFactory.getExpireSeconds());
    }

    @Override
    public void set(RedisKeyFactory keyFactory, Object value, long expire, TimeUnit timeUnit, Object... args) {
        String key = keyFactory.getKey(args);
        cacheService.set(key, value, timeUnit.toSeconds(expire));
        log.debug("缓存设置(自定义TTL): factory={}, key={}, ttl={}s",
                keyFactory.name(), key, timeUnit.toSeconds(expire));
    }

    @Override
    public <T> T get(RedisKeyFactory keyFactory, Class<T> clazz, Object... args) {
        String key = keyFactory.getKey(args);
        return cacheService.get(key, clazz);
    }

    @Override
    public Boolean delete(RedisKeyFactory keyFactory, Object... args) {
        String key = keyFactory.getKey(args);
        cacheService.delete(key);
        return true;
    }

    @Override
    public Boolean exists(RedisKeyFactory keyFactory, Object... args) {
        String key = keyFactory.getKey(args);
        return cacheService.exists(key);
    }

    @Override
    public Long increment(RedisKeyFactory keyFactory, long delta, Object... args) {
        String key = keyFactory.getKey(args);
        return cacheService.increment(key, delta);
    }

    @Override
    public Long decrement(RedisKeyFactory keyFactory, long delta, Object... args) {
        String key = keyFactory.getKey(args);
        // CacheService没有decrement方法，使用increment的负值
        return cacheService.increment(key, -delta);
    }

    // ==================== List 操作 ====================

    @Override
    public <T> List<T> getList(RedisKeyFactory keyFactory, Class<T> clazz, Object... args) {
        String key = keyFactory.getKey(args);
        return cacheService.getList(key, clazz);
    }

    @Override
    public void rightPush(RedisKeyFactory keyFactory, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            redisTemplate.opsForList().rightPush(key, value);
            // 设置过期时间
            if (keyFactory.hasExpire()) {
                redisTemplate.expire(key, keyFactory.getExpire(), keyFactory.getTimeUnit());
            }
        } catch (Exception e) {
            log.error("List右推失败: factory={}, key={}", keyFactory.name(), key, e);
        }
    }

    @Override
    public void leftPush(RedisKeyFactory keyFactory, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            redisTemplate.opsForList().leftPush(key, value);
            // 设置过期时间
            if (keyFactory.hasExpire()) {
                redisTemplate.expire(key, keyFactory.getExpire(), keyFactory.getTimeUnit());
            }
        } catch (Exception e) {
            log.error("List左推失败: factory={}, key={}", keyFactory.name(), key, e);
        }
    }

    // ==================== Set 操作 ====================

    @Override
    public Long addToSet(RedisKeyFactory keyFactory, Object[] values, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Long count = redisTemplate.opsForSet().add(key, values);
            // 设置过期时间
            if (keyFactory.hasExpire()) {
                redisTemplate.expire(key, keyFactory.getExpire(), keyFactory.getTimeUnit());
            }
            return count;
        } catch (Exception e) {
            log.error("Set添加失败: factory={}, key={}", keyFactory.name(), key, e);
            return 0L;
        }
    }

    @Override
    public Long removeFromSet(RedisKeyFactory keyFactory, Object[] values, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForSet().remove(key, values);
        } catch (Exception e) {
            log.error("Set移除失败: factory={}, key={}", keyFactory.name(), key, e);
            return 0L;
        }
    }

    @Override
    public Boolean isMemberOfSet(RedisKeyFactory keyFactory, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForSet().isMember(key, value);
        } catch (Exception e) {
            log.error("Set检查失败: factory={}, key={}", keyFactory.name(), key, e);
            return false;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Set<T> getSetMembers(RedisKeyFactory keyFactory, Class<T> clazz, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Set<Object> members = redisTemplate.opsForSet().members(key);
            if (members == null) {
                return Collections.emptySet();
            }
            return members.stream()
                    .map(obj -> (T) obj)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.error("Set获取失败: factory={}, key={}", keyFactory.name(), key, e);
            return Collections.emptySet();
        }
    }

    // ==================== ZSet 操作 ====================

    @Override
    public Boolean addToZSet(RedisKeyFactory keyFactory, Object value, double score, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Boolean result = redisTemplate.opsForZSet().add(key, value, score);
            // 设置过期时间
            if (keyFactory.hasExpire()) {
                redisTemplate.expire(key, keyFactory.getExpire(), keyFactory.getTimeUnit());
            }
            return result;
        } catch (Exception e) {
            log.error("ZSet添加失败: factory={}, key={}", keyFactory.name(), key, e);
            return false;
        }
    }

    @Override
    public Long removeFromZSet(RedisKeyFactory keyFactory, Object[] values, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForZSet().remove(key, values);
        } catch (Exception e) {
            log.error("ZSet移除失败: factory={}, key={}", keyFactory.name(), key, e);
            return 0L;
        }
    }

    @Override
    public Double getZSetScore(RedisKeyFactory keyFactory, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForZSet().score(key, value);
        } catch (Exception e) {
            log.error("ZSet获取分数失败: factory={}, key={}", keyFactory.name(), key, e);
            return null;
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> Set<T> getZSetRange(RedisKeyFactory keyFactory, long start, long end, Class<T> clazz, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Set<Object> range = redisTemplate.opsForZSet().range(key, start, end);
            if (range == null) {
                return Collections.emptySet();
            }
            return range.stream()
                    .map(obj -> (T) obj)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.error("ZSet范围获取失败: factory={}, key={}", keyFactory.name(), key, e);
            return Collections.emptySet();
        }
    }

    @Override
    public Long getZSetSize(RedisKeyFactory keyFactory, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForZSet().zCard(key);
        } catch (Exception e) {
            log.error("ZSet大小获取失败: factory={}, key={}", keyFactory.name(), key, e);
            return 0L;
        }
    }

    // ==================== Hash 操作 ====================

    @Override
    public void hashPut(RedisKeyFactory keyFactory, String field, Object value, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            redisTemplate.opsForHash().put(key, field, value);
            // 设置过期时间
            if (keyFactory.hasExpire()) {
                redisTemplate.expire(key, keyFactory.getExpire(), keyFactory.getTimeUnit());
            }
        } catch (Exception e) {
            log.error("Hash设置失败: factory={}, key={}, field={}", keyFactory.name(), key, field, e);
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public <T> T hashGet(RedisKeyFactory keyFactory, String field, Class<T> clazz, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Object value = redisTemplate.opsForHash().get(key, field);
            return (T) value;
        } catch (Exception e) {
            log.error("Hash获取失败: factory={}, key={}, field={}", keyFactory.name(), key, field, e);
            return null;
        }
    }

    @Override
    public Long hashDelete(RedisKeyFactory keyFactory, String[] fields, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            Object[] fieldObjs = Arrays.stream(fields).toArray();
            return redisTemplate.opsForHash().delete(key, fieldObjs);
        } catch (Exception e) {
            log.error("Hash删除失败: factory={}, key={}", keyFactory.name(), key, e);
            return 0L;
        }
    }

    @Override
    public Map<Object, Object> hashGetAll(RedisKeyFactory keyFactory, Object... args) {
        String key = keyFactory.getKey(args);
        try {
            return redisTemplate.opsForHash().entries(key);
        } catch (Exception e) {
            log.error("Hash获取所有失败: factory={}, key={}", keyFactory.name(), key, e);
            return Collections.emptyMap();
        }
    }

    // ==================== 批量操作 ====================

    @Override
    public Long deleteByPattern(RedisKeyFactory keyFactory) {
        String pattern = keyFactory.getPattern();
        cacheService.deleteByPattern(pattern);
        return 1L; // 返回固定值表示操作成功
    }

    @Override
    public Long deleteByPattern(String pattern) {
        cacheService.deleteByPattern(pattern);
        return 1L; // 返回固定值表示操作成功
    }

    @Override
    public Set<String> getKeys(RedisKeyFactory keyFactory) {
        String pattern = keyFactory.getPattern();
        return cacheService.getKeysByPattern(pattern);
    }
}
