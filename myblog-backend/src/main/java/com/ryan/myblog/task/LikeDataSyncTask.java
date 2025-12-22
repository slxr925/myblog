package com.ryan.myblog.task;

import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.UserLikeMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.UserLike;
import com.ryan.myblog.service.RedisLikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 点赞数据同步定时任务
 * 
 * 同步策略（重要面试点）：
 * 1. 正常情况：以Redis为准 → 修复MySQL
 * 2. Redis缺失：以MySQL为准 → 加载到Redis
 * 3. 智能判断：根据场景选择同步方向
 * 
 * 为什么以Redis为准？
 * - 用户所有操作都在Redis上
 * - MySQL只是异步持久化备份
 * - 如果不一致，很可能是异步持久化失败
 * 
 * 面试要点：
 * 1. 为什么不全部以MySQL为准？
 * - 会丢失Redis中最新的用户操作
 * - Redis是"真相源"（Source of Truth）
 * 
 * 2. 什么时候以MySQL为准？
 * - Redis宕机重启后，缓存为空
 * - 需要从MySQL加载初始数据
 * 
 * 3. 如何避免覆盖冲突？
 * - 优先保留Redis数据
 * - 记录详细日志
 * - 支持手动回滚
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LikeDataSyncTask {

    private final RedisLikeService redisLikeService;
    private final BlogMapper blogMapper;
    private final UserLikeMapper userLikeMapper;

    /**
     * 定时同步点赞数据
     * 
     * 执行频率：每小时一次
     * 执行时间：整点执行（例如：01:00, 02:00, ...）
     * 
     * 为什么是1小时？
     * - 频率适中，不会过度消耗资源
     * - 足够及时发现并修复数据不一致
     * - 异步持久化一般在秒级完成，1小时足够排查问题
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void syncLikeData() {
        log.info("开始执行点赞数据同步任务...");

        long startTime = System.currentTimeMillis();
        int totalBlogs = 0;
        int syncedFromRedis = 0; // 以Redis为准修复MySQL的数量
        int loadedFromMySQL = 0; // 从MySQL加载到Redis的数量
        int consistent = 0; // 数据一致的数量

        try {
            // 查询所有博客（可以优化为只查询有点赞的博客）
            List<Blog> blogs = blogMapper.selectList(null);
            totalBlogs = blogs.size();

            for (Blog blog : blogs) {
                try {
                    SyncResult result = syncBlogLikeData(blog.getId(), blog.getLikeCount().longValue());

                    switch (result) {
                        case SYNCED_FROM_REDIS:
                            syncedFromRedis++;
                            break;
                        case LOADED_FROM_MYSQL:
                            loadedFromMySQL++;
                            break;
                        case CONSISTENT:
                            consistent++;
                            break;
                    }

                } catch (Exception e) {
                    log.error("同步博客点赞数据失败: blogId={}", blog.getId(), e);
                }
            }

            long duration = System.currentTimeMillis() - startTime;

            log.info("点赞数据同步任务完成: 总数={}, 一致={}, Redis→MySQL={}, MySQL→Redis={}, 耗时={}ms",
                    totalBlogs, consistent, syncedFromRedis, loadedFromMySQL, duration);

        } catch (Exception e) {
            log.error("执行点赞数据同步任务失败", e);
        }
    }

    /**
     * 同步单个博客的点赞数据
     * 
     * @param blogId     博客ID
     * @param mysqlCount MySQL中的点赞数
     * @return 同步结果
     */
    private SyncResult syncBlogLikeData(Long blogId, Long mysqlCount) {
        // 获取Redis中的点赞数
        Long redisCount = redisLikeService.getLikeCount(blogId);

        // 情况1：Redis有数据，MySQL也有数据，但不一致
        if (redisCount != null && !redisCount.equals(mysqlCount)) {
            log.warn("发现数据不一致: blogId={}, Redis={}, MySQL={}",
                    blogId, redisCount, mysqlCount);

            // 策略：以Redis为准，同步到MySQL
            syncFromRedisToMySQL(blogId, redisCount);

            return SyncResult.SYNCED_FROM_REDIS;
        }

        // 情况2：Redis没有数据，但MySQL有数据（Redis可能重启了）
        else if (redisCount == null && mysqlCount != null && mysqlCount > 0) {
            log.warn("Redis缺失数据，从MySQL加载: blogId={}, count={}",
                    blogId, mysqlCount);

            // 策略：从MySQL加载初始数据到Redis
            redisLikeService.initBlogLikes(blogId);

            return SyncResult.LOADED_FROM_MYSQL;
        }

        // 情况3：两边都没有数据，或数据一致
        else {
            return SyncResult.CONSISTENT;
        }
    }

    /**
     * 从Redis同步数据到MySQL
     * 
     * 包括：
     * 1. 更新博客点赞总数
     * 2. 同步点赞用户列表
     * 
     * @param blogId     博客ID
     * @param redisCount Redis中的点赞数
     */
    @Transactional(rollbackFor = Exception.class)
    protected void syncFromRedisToMySQL(Long blogId, Long redisCount) {
        try {
            // 1. 更新博客点赞总数
            Blog blog = new Blog();
            blog.setId(blogId);
            blog.setLikeCount(redisCount.intValue());
            blog.setUpdateTime(LocalDateTime.now());
            blogMapper.updateById(blog);

            log.info("更新博客点赞数: blogId={}, count={}", blogId, redisCount);

            // 2. 同步点赞用户列表
            syncLikeUsersFromRedisToMySQL(blogId);

            log.info("同步博客点赞数据完成: blogId={}", blogId);

        } catch (Exception e) {
            log.error("从Redis同步到MySQL失败: blogId={}", blogId, e);
            throw e;
        }
    }

    /**
     * 从Redis同步点赞用户列表到MySQL
     * 
     * 逻辑：
     * 1. Redis有但MySQL没有 → 插入到MySQL
     * 2. MySQL有但Redis没有 → 更新MySQL状态为0（取消点赞）
     * 
     * @param blogId 博客ID
     */
    private void syncLikeUsersFromRedisToMySQL(Long blogId) {
        // 获取Redis中的所有点赞用户
        Set<Long> redisUsers = redisLikeService.getLikedUsers(blogId);

        // 获取MySQL中的点赞用户
        List<UserLike> mysqlLikes = userLikeMapper.selectByBlogId(blogId);
        Set<Long> mysqlLikedUsers = mysqlLikes.stream()
                .filter(like -> like.getStatus() == 1)
                .map(UserLike::getUserId)
                .collect(Collectors.toSet());

        // Redis有但MySQL没有 → 插入
        for (Long userId : redisUsers) {
            if (!mysqlLikedUsers.contains(userId)) {
                // 检查是否存在记录但状态为0
                UserLike existingLike = userLikeMapper.selectByUserAndTarget(
                        userId, "blog", blogId);

                if (existingLike != null) {
                    // 已存在记录，更新状态为1
                    existingLike.setStatus(1);
                    existingLike.setUpdateTime(LocalDateTime.now());
                    userLikeMapper.updateById(existingLike);

                    log.debug("更新点赞记录: userId={}, blogId={}", userId, blogId);
                } else {
                    // 不存在记录，插入新记录
                    UserLike newLike = new UserLike();
                    newLike.setUserId(userId);
                    newLike.setTargetType("blog");
                    newLike.setTargetId(blogId);
                    newLike.setStatus(1);
                    newLike.setCreateTime(LocalDateTime.now());
                    newLike.setUpdateTime(LocalDateTime.now());
                    userLikeMapper.insert(newLike);

                    log.debug("插入点赞记录: userId={}, blogId={}", userId, blogId);
                }
            }
        }

        // MySQL有但Redis没有 → 更新为取消点赞
        for (Long userId : mysqlLikedUsers) {
            if (!redisUsers.contains(userId)) {
                UserLike like = userLikeMapper.selectByUserAndTarget(
                        userId, "blog", blogId);

                if (like != null && like.getStatus() == 1) {
                    like.setStatus(0);
                    like.setUpdateTime(LocalDateTime.now());
                    userLikeMapper.updateById(like);

                    log.debug("取消点赞记录: userId={}, blogId={}", userId, blogId);
                }
            }
        }
    }

    /**
     * 同步结果枚举
     */
    private enum SyncResult {
        SYNCED_FROM_REDIS, // 从Redis同步到MySQL
        LOADED_FROM_MYSQL, // 从MySQL加载到Redis
        CONSISTENT // 数据一致，无需同步
    }
}
