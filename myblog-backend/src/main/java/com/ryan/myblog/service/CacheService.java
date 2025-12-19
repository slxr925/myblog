package com.ryan.myblog.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 缓存服务接口
 */
public interface CacheService {

    /**
     * 设置缓存
     */
    void set(String key, Object value);

    /**
     * 设置缓存（带过期时间）
     */
    void set(String key, Object value, long seconds);

    /**
     * 获取缓存
     */
    <T> T get(String key, Class<T> clazz);

    /**
     * 获取列表缓存（支持泛型元素类型）
     */
    <T> List<T> getList(String key, Class<T> elementType);

    /**
     * 删除缓存
     */
    void delete(String key);

    /**
     * 检查缓存是否存在
     */
    boolean exists(String key);

    /**
     * 设置过期时间
     */
    void expire(String key, long seconds);

    /**
     * 批量设置缓存
     */
    void multiSet(Map<String, Object> keyValues);

    /**
     * 批量设置缓存（带过期时间）
     */
    void multiSet(Map<String, Object> keyValues, long seconds);

    /**
     * 批量获取缓存
     */
    <T> List<T> multiGet(List<String> keys, Class<T> clazz);

    /**
     * 批量删除缓存
     */
    void multiDelete(List<String> keys);

    /**
     * 根据模式删除缓存
     */
    void deleteByPattern(String pattern);

    /**
     * 获取所有匹配模式的键
     */
    Set<String> getKeysByPattern(String pattern);

    /**
     * 获取缓存的剩余过期时间（秒）
     */
    long getExpire(String key);

    /**
     * 自增操作
     */
    long increment(String key);

    /**
     * 自增操作（指定增量）
     */
    long increment(String key, long delta);

    /**
     * 获取缓存大小（字节）
     */
    long getSize(String key);

    /**
     * 清除所有缓存
     */
    void clear();

    /**
     * 获取缓存统计信息
     */
    Map<String, Object> getCacheStats();
}