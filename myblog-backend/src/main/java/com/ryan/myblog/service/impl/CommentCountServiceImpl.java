package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CommentMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.service.CommentCountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 评论计数缓存服务实现
 * 
 * Redis Key 设计：
 * - blog:comment:count:{blogId} - 评论计数
 * 
 * 性能优化：
 * - 批量查询使用 Pipeline
 * - 不设置过期时间（长期有效）
 * - 故障降级到数据库
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentCountServiceImpl implements CommentCountService {

    private final StringRedisTemplate redisTemplate;
    private final CommentMapper commentMapper;
    private final BlogMapper blogMapper;

    private static final String COMMENT_COUNT_PREFIX = "blog:comment:count:";

    @Override
    public Long getCommentCount(Long blogId) {
        String countKey = COMMENT_COUNT_PREFIX + blogId;

        try {
            String cached = redisTemplate.opsForValue().get(countKey);

            if (cached != null) {
                return Long.parseLong(cached);
            }

            // Redis 未命中，从数据库恢复
            log.warn("评论数缓存未命中，从数据库恢复: blogId={}", blogId);
            recoverFromDatabase(blogId);

            cached = redisTemplate.opsForValue().get(countKey);
            return cached != null ? Long.parseLong(cached) : 0L;

        } catch (Exception e) {
            log.error("获取评论数失败，降级到数据库查询: blogId={}", blogId, e);
            // 降级：直接查数据库
            Integer count = commentMapper.countByBlogId(blogId);
            return count != null ? count.longValue() : 0L;
        }
    }

    @Override
    public Map<Long, Long> batchGetCommentCounts(List<Long> blogIds) {
        if (blogIds == null || blogIds.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<Long, Long> result = new HashMap<>();

        try {
            // 使用 Pipeline 批量获取
            List<Object> values = redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
                for (Long blogId : blogIds) {
                    byte[] key = (COMMENT_COUNT_PREFIX + blogId).getBytes();
                    connection.stringCommands().get(key);
                }
                return null;
            });

            // 处理结果
            for (int i = 0; i < blogIds.size(); i++) {
                Long blogId = blogIds.get(i);
                Object value = values.get(i);

                if (value != null) {
                    result.put(blogId, Long.parseLong(value.toString()));
                } else {
                    // 未命中，恢复并重新获取
                    recoverFromDatabase(blogId);
                    result.put(blogId, getCommentCount(blogId));
                }
            }

        } catch (Exception e) {
            log.error("批量获取评论数失败，降级处理", e);
            // 降级：逐个查询数据库
            for (Long blogId : blogIds) {
                Integer count = commentMapper.countByBlogId(blogId);
                result.put(blogId, count != null ? count.longValue() : 0L);
            }
        }

        return result;
    }

    @Override
    public void incrementCommentCount(Long blogId) {
        String countKey = COMMENT_COUNT_PREFIX + blogId;

        try {
            Long newCount = redisTemplate.opsForValue().increment(countKey);
            log.debug("评论数 +1: blogId={}, newCount={}", blogId, newCount);

        } catch (Exception e) {
            log.error("评论数增加失败: blogId={}", blogId, e);
            // 失败不阻塞业务，定时任务会修复
        }
    }

    @Override
    public void decrementCommentCount(Long blogId) {
        String countKey = COMMENT_COUNT_PREFIX + blogId;

        try {
            Long newCount = redisTemplate.opsForValue().decrement(countKey);

            // 防止变成负数
            if (newCount != null && newCount < 0) {
                redisTemplate.opsForValue().set(countKey, "0");
                log.warn("评论数出现负数，已重置为0: blogId={}", blogId);
            }

            log.debug("评论数 -1: blogId={}, newCount={}", blogId, newCount);

        } catch (Exception e) {
            log.error("评论数减少失败: blogId={}", blogId, e);
        }
    }

    @Override
    public void recoverFromDatabase(Long blogId) {
        String countKey = COMMENT_COUNT_PREFIX + blogId;

        try {
            // 从数据库查询实际评论数
            Integer dbCount = commentMapper.countByBlogId(blogId);
            Long count = dbCount != null ? dbCount.longValue() : 0L;

            // 写入 Redis（不设置过期时间）
            redisTemplate.opsForValue().set(countKey, count.toString());

            log.info("从数据库恢复评论数: blogId={}, count={}", blogId, count);

        } catch (Exception e) {
            log.error("从数据库恢复评论数失败: blogId={}", blogId, e);
        }
    }

    @Override
    public void warmUpCache(int limit) {
        try {
            // 查询最新的 N 篇博客
            List<Blog> blogs = blogMapper.selectList(
                    new LambdaQueryWrapper<Blog>()
                            .eq(Blog::getDeleted, 0)
                            .orderByDesc(Blog::getCreateTime)
                            .last("LIMIT " + limit));

            log.info("开始预热评论数缓存，数量: {}", blogs.size());

            for (Blog blog : blogs) {
                recoverFromDatabase(blog.getId());
            }

            log.info("评论数缓存预热完成");

        } catch (Exception e) {
            log.error("评论数缓存预热失败", e);
        }
    }
}
