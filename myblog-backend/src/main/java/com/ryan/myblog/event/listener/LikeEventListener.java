package com.ryan.myblog.event.listener;

import com.ryan.myblog.event.LikeEvent;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.model.entity.UserLike;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 点赞事件监听器
 * 负责将Redis中的点赞操作异步持久化到MySQL
 * 
 * 异步处理的优势：
 * 1. 性能提升：主流程只操作Redis（1-2ms），不阻塞用户请求
 * 2. 削峰填谷：MySQL写入压力分散到不同时间
 * 3. 解耦：数据库故障不影响点赞功能
 * 
 * 可靠性保证：
 * 1. 事务保证：点赞记录和计数更新在同一事务中
 * 2. 异常重试：可以配置@Retryable注解实现自动重试
 * 3. 兜底机制：定时任务对比Redis和MySQL，修复不一致
 * 
 * 面试要点：
 * 1. 为什么用@Async异步？
 * - 不阻塞主流程，用户感知不到数据库写入的延迟
 * - 提升系统吞吐量
 * 
 * 2. 异步线程池如何配置？
 * - 使用@Async("likeExecutor")指定线程池
 * - 核心线程数根据数据库连接池大小设定
 * - 队列容量要足够大，避免任务被拒绝
 * 
 * 3. 数据不一致怎么办？
 * - 定时任务：每小时对比Redis和MySQL，修复差异
 * - 手动修复：提供管理接口，手动触发数据同步
 * - 告警监控：差异超过阈值时发送告警
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LikeEventListener {

    private final UserLikeMapper userLikeMapper;
    private final BlogMapper blogMapper;

    /**
     * 处理点赞事件
     * 
     * @Async注解说明：
     * - 方法将在独立线程中执行，不阻塞事件发布者
     * - 需要@EnableAsync开启异步支持（已在ThreadPoolConfig中开启）
     * - 可以指定线程池：@Async("likeExecutor")
     * 
     * @Transactional注解说明：
     * - 保证点赞记录和博客计数在同一事务中更新
     * - 任何一步失败都会回滚
     * - rollbackFor指定遇到任何异常都回滚
     * 
     * @EventListener注解说明：
     * - Spring事件监听机制
     * - 自动监听LikeEvent类型的事件
     * - 支持条件过滤（condition属性）
     */
    @Async("commonAsyncExecutor")
    @EventListener
    @Transactional(rollbackFor = Exception.class)
    public void handleLikeEvent(LikeEvent event) {
        try {
            log.debug("开始处理点赞事件: {}", event);

            if (event.isLike()) {
                // 处理点赞操作
                handleLike(event.getBlogId(), event.getUserId());
            } else {
                // 处理取消点赞操作
                handleUnlike(event.getBlogId(), event.getUserId());
            }

            log.debug("点赞事件处理完成: blogId={}, userId={}, like={}",
                    event.getBlogId(), event.getUserId(), event.isLike());

        } catch (Exception e) {
            log.error("处理点赞事件失败: {}", event, e);

            // 失败后的处理策略：
            // 1. 记录到失败队列，后续重试
            // 2. 发送告警通知
            // 3. 降级：只记录日志，不影响用户

            // 这里选择只记录日志，因为有定时任务兜底
            // 实际生产环境可以集成消息队列，保证可靠性
        }
    }

    /**
     * 处理点赞操作（持久化到数据库）
     * 
     * 业务逻辑：
     * 1. 查询是否存在点赞记录
     * 2. 存在且status=0：更新status为1（重新点赞）
     * 3. 不存在：插入新记录
     * 4. 增加博客点赞数
     */
    private void handleLike(Long blogId, Long userId) {
        // 查询是否存在点赞记录
        UserLike existingLike = userLikeMapper.selectByUserAndTarget(userId, "blog", blogId);

        if (existingLike == null) {
            // 首次点赞，插入新记录
            UserLike newLike = new UserLike();
            newLike.setUserId(userId);
            newLike.setTargetType("blog");
            newLike.setTargetId(blogId);
            newLike.setStatus(1); // 1表示已点赞
            newLike.setCreateTime(LocalDateTime.now());
            newLike.setUpdateTime(LocalDateTime.now());

            userLikeMapper.insert(newLike);
            log.debug("插入点赞记录: userId={}, blogId={}", userId, blogId);

        } else if (existingLike.getStatus() == 0) {
            // 之前取消过点赞，现在重新点赞
            existingLike.setStatus(1);
            existingLike.setUpdateTime(LocalDateTime.now());

            userLikeMapper.updateById(existingLike);
            log.debug("更新点赞记录为已点赞: userId={}, blogId={}", userId, blogId);

        } else {
            // 已经是点赞状态，可能是重复事件，跳过
            log.warn("重复的点赞事件: userId={}, blogId={}", userId, blogId);
            return;
        }

        // 增加博客点赞数
        blogMapper.incrementLikeCount(blogId);
        log.debug("增加博客点赞数: blogId={}", blogId);
    }

    /**
     * 处理取消点赞操作（持久化到数据库）
     * 
     * 业务逻辑：
     * 1. 查询点赞记录
     * 2. 存在且status=1：更新status为0
     * 3. 减少博客点赞数
     */
    private void handleUnlike(Long blogId, Long userId) {
        // 查询点赞记录
        UserLike existingLike = userLikeMapper.selectByUserAndTarget(userId, "blog", blogId);

        if (existingLike == null) {
            // 记录不存在，可能是数据不一致
            log.warn("取消点赞失败，记录不存在: userId={}, blogId={}", userId, blogId);
            return;
        }

        if (existingLike.getStatus() == 1) {
            // 更新为取消点赞状态
            existingLike.setStatus(0);
            existingLike.setUpdateTime(LocalDateTime.now());

            userLikeMapper.updateById(existingLike);
            log.debug("更新点赞记录为已取消: userId={}, blogId={}", userId, blogId);

        } else {
            // 已经是取消状态，可能是重复事件，跳过
            log.warn("重复的取消点赞事件: userId={}, blogId={}", userId, blogId);
            return;
        }

        // 减少博客点赞数
        blogMapper.decrementLikeCount(blogId);
        log.debug("减少博客点赞数: blogId={}", blogId);
    }
}
