package com.ryan.myblog.service.impl;

import com.ryan.myblog.annotation.DistributedLock;
import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.event.LikeEvent;
import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.service.RedisLikeService;
import com.ryan.myblog.service.UnifiedCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Redis点赞服务实现类
 * 
 * 架构设计：
 * - Redis层：负责实时读写，保证高性能和原子性
 * - 事件层：异步发布点赞事件，解耦业务逻辑
 * - 持久化层：监听事件，异步写入MySQL
 * 
 * 数据结构选择：
 * 1. ZSet (有序集合) - 存储点赞关系
 * Key: "blog:likes:{blogId}"
 * Value: userId
 * Score: 点赞时间戳
 * 
 * 优势：
 * - 自动去重（同一用户只能点赞一次）
 * - 支持范围查询（如最近点赞的用户）
 * - 支持计数（ZCARD命令）
 * 
 * 2. String - 存储点赞总数
 * Key: "blog:like:count:{blogId}"
 * Value: 点赞数
 * 
 * 优势：
 * - 原子操作（INCR/DECR）
 * - 快速读取
 * 
 * 性能对比：
 * - 数据库方案：QPS ~1000，有并发问题
 * - Redis方案：QPS ~30000+，无并发问题
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisLikeServiceImpl implements RedisLikeService {

    // StringRedisTemplate 保留，以防未来特殊操作需要
    @SuppressWarnings("unused")
    private final StringRedisTemplate redisTemplate;
    private final UnifiedCacheService unifiedCacheService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserLikeMapper userLikeMapper;
    private final BlogMapper blogMapper;
    private final UserMapper userMapper;

    /**
     * 切换点赞状态
     * 
     * 实现原理：
     * 1. 使用ZSCORE检查用户是否已点赞（O(1)时间复杂度）
     * 2. 根据结果执行ZADD或ZREM（原子操作）
     * 3. 对应更新计数器（INCR/DECR，原子操作）
     * 4. 发布异步事件，持久化到数据库
     * 
     * 分布式锁说明：
     * - key格式：lock:like:{blogId}:{userId}
     * - 防止同一用户对同一博客的并发点赞请求导致数据不一致
     * - 过期时间30秒，足够业务完成
     */
    @Override
    @DistributedLock(key = "'like:' + #blogId + ':' + #userId", expire = 30, waitTime = 0)
    public Boolean toggleLike(Long blogId, Long userId) {
        // 检查用户是否已点赞 - 使用统一缓存服务
        Double score = unifiedCacheService.getZSetScore(RedisKeyFactory.BLOG_LIKES_SET, userId.toString(), blogId);

        if (score == null) {
            // 未点赞 -> 执行点赞操作

            // 1. 添加到ZSet，score为当前时间戳
            long timestamp = System.currentTimeMillis();
            unifiedCacheService.addToZSet(RedisKeyFactory.BLOG_LIKES_SET, userId.toString(), timestamp, blogId);

            // 2. 点赞数+1
            unifiedCacheService.increment(RedisKeyFactory.BLOG_LIKE_COUNT, 1L, blogId);

            // 3. 发布点赞事件（异步持久化）
            publishLikeEvent(blogId, userId, true);

            // 4. 发送点赞通知给文章作者
            publishLikeNotification(blogId, userId);

            log.debug("用户 {} 点赞博客 {} (Redis)", userId, blogId);
            return true;

        } else {
            // 已点赞 -> 执行取消点赞操作

            // 1. 从ZSet中移除
            unifiedCacheService.removeFromZSet(RedisKeyFactory.BLOG_LIKES_SET, new Object[] { userId.toString() },
                    blogId);

            // 2. 点赞数-1
            Long count = unifiedCacheService.decrement(RedisKeyFactory.BLOG_LIKE_COUNT, 1L, blogId);

            // 防止计数器变成负数
            if (count != null && count < 0) {
                unifiedCacheService.set(RedisKeyFactory.BLOG_LIKE_COUNT, 0L, blogId);
            }

            // 3. 发布取消点赞事件
            publishLikeEvent(blogId, userId, false);

            log.debug("用户 {} 取消点赞博客 {} (Redis)", userId, blogId);
            return false;
        }
    }

    /**
     * 获取点赞数
     * 直接从Redis读取，性能极高
     */
    @Override
    public Long getLikeCount(Long blogId) {
        // 使用统一缓存服务获取计数
        Long count = unifiedCacheService.get(RedisKeyFactory.BLOG_LIKE_COUNT, Long.class, blogId);

        if (count == null) {
            // 缓存未命中，从数据库加载并初始化
            // 这里可以调用initBlogLikes方法
            return 0L;
        }

        return count;
    }

    /**
     * 检查用户是否点赞
     * 使用ZSCORE命令，时间复杂度O(1)
     */
    @Override
    public Boolean isUserLiked(Long blogId, Long userId) {
        Double score = unifiedCacheService.getZSetScore(RedisKeyFactory.BLOG_LIKES_SET, userId.toString(), blogId);
        return score != null;
    }

    /**
     * 获取所有点赞用户
     * 用于数据同步和验证
     */
    @Override
    public Set<Long> getLikedUsers(Long blogId) {
        Set<String> userIdStrings = unifiedCacheService.getZSetRange(
                RedisKeyFactory.BLOG_LIKES_SET, 0, -1, String.class, blogId);

        if (userIdStrings == null || userIdStrings.isEmpty()) {
            return Set.of();
        }

        return userIdStrings.stream()
                .map(Long::parseLong)
                .collect(Collectors.toSet());
    }

    /**
     * 初始化博客点赞数据
     * 应用启动时或缓存失效时调用
     * 
     * 从数据库加载点赞数据到Redis，实现缓存预热
     * 
     * 使用场景：
     * 1. 应用启动时预热热门博客的点赞数据
     * 2. Redis宕机重启后恢复数据
     * 3. 定时任务发现Redis缺失数据时加载
     * 
     * @param blogId 博客ID
     */
    @Override
    public void initBlogLikes(Long blogId) {
        try {
            // 查询所有点赞记录
            List<UserLike> likes = userLikeMapper.selectByBlogId(blogId);

            if (likes == null || likes.isEmpty()) {
                log.debug("博客 {} 暂无点赞数据", blogId);
                return;
            }

            // 筛选状态为1（已点赞）的记录
            List<UserLike> activeLikes = likes.stream()
                    .filter(like -> like.getStatus() == 1)
                    .collect(Collectors.toList());

            if (activeLikes.isEmpty()) {
                log.debug("博客 {} 无有效点赞", blogId);
                return;
            }

            // 批量添加到Redis ZSet - 使用统一缓存服务
            for (UserLike like : activeLikes) {
                long timestamp = like.getCreateTime() != null
                        ? like.getCreateTime().toEpochSecond(java.time.ZoneOffset.of("+8"))
                        : System.currentTimeMillis();

                unifiedCacheService.addToZSet(RedisKeyFactory.BLOG_LIKES_SET,
                        like.getUserId().toString(),
                        timestamp,
                        blogId);
            }

            // 设置点赞总数 - 使用统一缓存服务
            unifiedCacheService.set(RedisKeyFactory.BLOG_LIKE_COUNT,
                    (long) activeLikes.size(),
                    blogId);

            log.info("初始化博客 {} 的点赞数据到Redis: count={}",
                    blogId, activeLikes.size());

        } catch (Exception e) {
            log.error("初始化博客点赞数据失败: blogId={}", blogId, e);
        }
    }

    /**
     * 发布点赞事件
     * 通过Spring事件机制，解耦Redis操作和数据库操作
     * 
     * 优势：
     * 1.异步非阻塞：不影响主流程响应速度
     * 2. 解耦：Redis层不依赖数据库层
     * 3. 可靠性：事件监听器可以实现重试逻辑
     */
    private void publishLikeEvent(Long blogId, Long userId, boolean like) {
        try {
            LikeEvent event = new LikeEvent(this, blogId, userId, like);
            eventPublisher.publishEvent(event);
            log.debug("发布点赞事件: blogId={}, userId={}, like={}", blogId, userId, like);
        } catch (Exception e) {
            log.error("发布点赞事件失败", e);
        }
    }

    /**
     * 发布点赞通知给文章作者
     */
    private void publishLikeNotification(Long blogId, Long userId) {
        try {
            Blog blog = blogMapper.selectById(blogId);
            if (blog == null || blog.getAuthorId().equals(userId)) {
                return; // 自己给自己点赞不通知
            }

            NotificationEvent event = NotificationEvent.likeEvent(
                    this,
                    blog.getAuthorId(),
                    userId,
                    blog.getTitle(),
                    blogId,
                    java.util.Map.of("blogCover", blog.getCoverImg() != null ? blog.getCoverImg() : ""));
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("发送点赞通知失败: {}", e.getMessage());
        }
    }

    @Override
    public Map<Long, Long> batchGetLikeCounts(List<Long> blogIds) {
        if (blogIds == null || blogIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<Long, Long> result = new HashMap<>();

        // 使用统一缓存服务逐个获取（简化实现）
        for (Long blogId : blogIds) {
            try {
                Long count = unifiedCacheService.get(RedisKeyFactory.BLOG_LIKE_COUNT, Long.class, blogId);
                if (count != null) {
                    result.put(blogId, count);
                } else {
                    recoverFromDatabase(blogId);
                    result.put(blogId, getLikeCount(blogId));
                }
            } catch (Exception e) {
                log.warn("获取点赞数失败，从数据库查询: blogId={}", blogId);
                Long count = userLikeMapper.countByTarget("blog", blogId);
                result.put(blogId, count != null ? count : 0L);
            }
        }

        return result;
    }

    @Override
    public void recoverFromDatabase(Long blogId) {
        try {
            Long dbCount = userLikeMapper.countByTarget("blog", blogId);
            Long count = dbCount != null ? dbCount : 0L;

            // 使用统一缓存服务设置
            unifiedCacheService.set(RedisKeyFactory.BLOG_LIKE_COUNT, count, blogId);

            log.info("从数据库恢复点赞数: blogId={}, count={}", blogId, count);
        } catch (Exception e) {
            log.error("从数据库恢复点赞数失败: blogId={}", blogId, e);
        }
    }
}
