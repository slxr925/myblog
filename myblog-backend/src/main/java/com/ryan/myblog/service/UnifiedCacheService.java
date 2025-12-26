package com.ryan.myblog.service;

import com.ryan.myblog.common.RedisKeyFactory;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * 统一缓存服务接口
 * 
 * 作为所有Redis操作的统一入口，强制使用RedisKeyFactory管理Key
 * 
 * 设计原则:
 * 1. 所有方法必须传入RedisKeyFactory枚举，杜绝硬编码
 * 2. 自动处理TTL，防止Key永久存在
 * 3. 统一异常处理，Redis故障不影响主业务
 * 4. 支持常见数据结构：String, List, Set, ZSet, Hash
 */
public interface UnifiedCacheService {

    // ==================== String 操作 ====================

    /**
     * 设置缓存（使用Key工厂定义的TTL）
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param args       Key参数
     */
    void set(RedisKeyFactory keyFactory, Object value, Object... args);

    /**
     * 设置缓存（自定义TTL）
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param expire     过期时间
     * @param timeUnit   时间单位
     * @param args       Key参数
     */
    void set(RedisKeyFactory keyFactory, Object value, long expire, TimeUnit timeUnit, Object... args);

    /**
     * 获取缓存
     * 
     * @param keyFactory Key工厂枚举
     * @param clazz      值类型
     * @param args       Key参数
     * @return 缓存值，不存在返回null
     */
    <T> T get(RedisKeyFactory keyFactory, Class<T> clazz, Object... args);

    /**
     * 删除缓存
     * 
     * @param keyFactory Key工厂枚举
     * @param args       Key参数
     * @return 是否成功
     */
    Boolean delete(RedisKeyFactory keyFactory, Object... args);

    /**
     * 检查Key是否存在
     * 
     * @param keyFactory Key工厂枚举
     * @param args       Key参数
     * @return 是否存在
     */
    Boolean exists(RedisKeyFactory keyFactory, Object... args);

    /**
     * 自增操作
     * 
     * @param keyFactory Key工厂枚举
     * @param delta      增量
     * @param args       Key参数
     * @return 自增后的值
     */
    Long increment(RedisKeyFactory keyFactory, long delta, Object... args);

    /**
     * 自减操作
     * 
     * @param keyFactory Key工厂枚举
     * @param delta      减量
     * @param args       Key参数
     * @return 自减后的值
     */
    Long decrement(RedisKeyFactory keyFactory, long delta, Object... args);

    // ==================== List 操作 ====================

    /**
     * 获取List类型缓存
     * 
     * @param keyFactory Key工厂枚举
     * @param clazz      元素类型
     * @param args       Key参数
     * @return List缓存，不存在返回null
     */
    <T> List<T> getList(RedisKeyFactory keyFactory, Class<T> clazz, Object... args);

    /**
     * 右侧推入List
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param args       Key参数
     */
    void rightPush(RedisKeyFactory keyFactory, Object value, Object... args);

    /**
     * 左侧推入List
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param args       Key参数
     */
    void leftPush(RedisKeyFactory keyFactory, Object value, Object... args);

    // ==================== Set 操作 ====================

    /**
     * 添加到Set
     * 
     * @param keyFactory Key工厂枚举
     * @param values     值列表
     * @param args       Key参数
     * @return 添加成功的数量
     */
    Long addToSet(RedisKeyFactory keyFactory, Object[] values, Object... args);

    /**
     * 从Set中移除
     * 
     * @param keyFactory Key工厂枚举
     * @param values     值列表
     * @param args       Key参数
     * @return 移除的数量
     */
    Long removeFromSet(RedisKeyFactory keyFactory, Object[] values, Object... args);

    /**
     * 检查Set中是否存在
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param args       Key参数
     * @return 是否存在
     */
    Boolean isMemberOfSet(RedisKeyFactory keyFactory, Object value, Object... args);

    /**
     * 获取Set所有成员
     * 
     * @param keyFactory Key工厂枚举
     * @param clazz      元素类型
     * @param args       Key参数
     * @return Set成员
     */
    <T> Set<T> getSetMembers(RedisKeyFactory keyFactory, Class<T> clazz, Object... args);

    // ==================== ZSet 操作 ====================

    /**
     * 添加到ZSet
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param score      分数
     * @param args       Key参数
     * @return 是否添加成功
     */
    Boolean addToZSet(RedisKeyFactory keyFactory, Object value, double score, Object... args);

    /**
     * 从ZSet中移除
     * 
     * @param keyFactory Key工厂枚举
     * @param values     值列表
     * @param args       Key参数
     * @return 移除的数量
     */
    Long removeFromZSet(RedisKeyFactory keyFactory, Object[] values, Object... args);

    /**
     * 获取ZSet成员的分数
     * 
     * @param keyFactory Key工厂枚举
     * @param value      值
     * @param args       Key参数
     * @return 分数，不存在返回null
     */
    Double getZSetScore(RedisKeyFactory keyFactory, Object value, Object... args);

    /**
     * 获取ZSet指定范围的成员
     * 
     * @param keyFactory Key工厂枚举
     * @param start      起始索引
     * @param end        结束索引
     * @param clazz      元素类型
     * @param args       Key参数
     * @return Set成员
     */
    <T> Set<T> getZSetRange(RedisKeyFactory keyFactory, long start, long end, Class<T> clazz, Object... args);

    /**
     * 获取ZSet大小
     * 
     * @param keyFactory Key工厂枚举
     * @param args       Key参数
     * @return 大小
     */
    Long getZSetSize(RedisKeyFactory keyFactory, Object... args);

    // ==================== Hash 操作 ====================

    /**
     * Hash设置字段
     * 
     * @param keyFactory Key工厂枚举
     * @param field      字段名
     * @param value      值
     * @param args       Key参数
     */
    void hashPut(RedisKeyFactory keyFactory, String field, Object value, Object... args);

    /**
     * Hash获取字段
     * 
     * @param keyFactory Key工厂枚举
     * @param field      字段名
     * @param clazz      值类型
     * @param args       Key参数
     * @return 字段值
     */
    <T> T hashGet(RedisKeyFactory keyFactory, String field, Class<T> clazz, Object... args);

    /**
     * Hash删除字段
     * 
     * @param keyFactory Key工厂枚举
     * @param fields     字段名列表
     * @param args       Key参数
     * @return 删除的数量
     */
    Long hashDelete(RedisKeyFactory keyFactory, String[] fields, Object... args);

    /**
     * Hash获取所有字段
     * 
     * @param keyFactory Key工厂枚举
     * @param args       Key参数
     * @return 所有字段值
     */
    Map<Object, Object> hashGetAll(RedisKeyFactory keyFactory, Object... args);

    // ==================== 批量操作 ====================

    /**
     * 根据模式删除（使用KeyFactory的pattern）
     * 
     * @param keyFactory Key工厂枚举
     * @return 删除的数量
     */
    Long deleteByPattern(RedisKeyFactory keyFactory);

    /**
     * 根据自定义模式删除
     * 
     * @param pattern 自定义模式
     * @return 删除的数量
     */
    Long deleteByPattern(String pattern);

    /**
     * 获取匹配的所有Key
     * 
     * @param keyFactory Key工厂枚举
     * @return Key列表
     */
    Set<String> getKeys(RedisKeyFactory keyFactory);
}
