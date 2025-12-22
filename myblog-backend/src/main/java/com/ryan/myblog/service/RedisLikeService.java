package com.ryan.myblog.service;

import java.util.List;
import java.util.Map;

/**
 * Redis点赞服务接口
 * 使用Redis实现高性能点赞功能
 * 
 * 面试要点：
 * 1. 为什么用Redis而不是直接操作数据库？
 * - Redis是内存数据库，读写速度快（10万+ QPS）
 * - 支持原子操作，天然解决并发问题
 * - 减少数据库压力
 * 
 * 2. 如何保证数据可靠性？
 * - Redis数据异步持久化到MySQL
 * - 使用Spring事件机制，解耦业务逻辑
 * - 定时任务兜底，确保最终一致性
 * 
 * 3. Redis使用什么数据结构？
 * - ZSet(有序集合)：存储点赞用户，score为时间戳
 * - String：存储点赞总数
 * - 优势：支持范围查询、去重、计数
 */
public interface RedisLikeService {

    /**
     * 切换点赞状态（点赞/取消点赞）
     * 
     * @param blogId 博客ID
     * @param userId 用户ID
     * @return true-点赞成功, false-取消点赞
     */
    Boolean toggleLike(Long blogId, Long userId);

    /**
     * 获取博客点赞数（直接从 Redis）
     * 
     * @param blogId 博客ID
     * @return 点赞总数
     */
    Long getLikeCount(Long blogId);

    /**
     * 检查用户是否点赞
     * 
     * @param blogId 博客ID
     * @param userId 用户ID
     * @return true-已点赞, false-未点赞
     */
    Boolean isUserLiked(Long blogId, Long userId);

    /**
     * 获取博客的所有点赞用户ID列表
     * 用于数据同步和验证
     * 
     * @param blogId 博客ID
     * @return 用户ID列表
     */
    java.util.Set<Long> getLikedUsers(Long blogId);

    /**
     * 批量初始化博客点赞数据到Redis
     * 用于应用启动时的数据预热
     * 
     * @param blogId 博客ID
     */
    void initBlogLikes(Long blogId);

    /**
     * 批量获取点赞数
     * 使用 Redis Pipeline 优化性能
     * 
     * @param blogIds 博客ID列表
     * @return Map<博客ID, 点赞数>
     */
    Map<Long, Long> batchGetLikeCounts(List<Long> blogIds);

    /**
     * 从数据库恢复点赞数到 Redis
     * 用于：
     * 1. Redis 故障恢复
     * 2. 缓存未命中时懒加载
     * 3. 缓存预热
     * 
     * @param blogId 博客ID
     */
    void recoverFromDatabase(Long blogId);
}
