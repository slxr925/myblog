package com.ryan.myblog.service;

import java.util.List;
import java.util.Map;

/**
 * 评论计数缓存服务
 * 
 * 核心功能：
 * 1. 维护博客评论数的 Redis 缓存
 * 2. 评论新增/删除时实时更新
 * 3. 支持批量查询和预热
 * 
 * 设计原则：
 * - Redis 为主数据源，MySQL 为备份
 * - 不设置过期时间，长期有效
 * - 支持故障降级和恢复
 */
public interface CommentCountService {

    /**
     * 获取博客评论数（直接从 Redis）
     * 
     * @param blogId 博客ID
     * @return 评论数
     */
    Long getCommentCount(Long blogId);

    /**
     * 批量获取评论数
     * 使用 Redis Pipeline 优化性能
     * 
     * @param blogIds 博客ID列表
     * @return Map<博客ID, 评论数>
     */
    Map<Long, Long> batchGetCommentCounts(List<Long> blogIds);

    /**
     * 增加评论数 (+1)
     * 评论新增时调用
     * 
     * @param blogId 博客ID
     */
    void incrementCommentCount(Long blogId);

    /**
     * 减少评论数 (-1)
     * 评论删除时调用
     * 
     * @param blogId 博客ID
     */
    void decrementCommentCount(Long blogId);

    /**
     * 从数据库恢复计数到 Redis
     * 用于：
     * 1. Redis 故障恢复
     * 2. 缓存未命中时懒加载
     * 3. 缓存预热
     * 
     * @param blogId 博客ID
     */
    void recoverFromDatabase(Long blogId);

    /**
     * 批量预热缓存
     * 应用启动时调用，加载热点数据到 Redis
     * 
     * @param limit 预热数量（建议：1000）
     */
    void warmUpCache(int limit);
}
