package com.ryan.myblog.runner;

import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CommentCountService;
import com.ryan.myblog.service.RedisLikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 缓存预热服务
 * 在应用启动时自动预热关键缓存，提升首次访问性能
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "cache.warmup.enabled", havingValue = "true", matchIfMissing = true)
public class CacheWarmUpRunner implements ApplicationRunner {

    private final BlogService blogService;
    private final RedisLikeService redisLikeService;
    private final CommentCountService commentCountService;
    private final BlogMapper blogMapper;

    @Override
    public void run(ApplicationArguments args) {
        log.info("================== 开始缓存预热 ==================");
        long startTime = System.currentTimeMillis();

        try {
            // 1. 预热博客列表缓存
            warmUpBlogLists();

            // 2. 预热博客点赞数缓存
            warmUpLikeCounts();

            // 3. 预热博客评论数缓存
            warmUpCommentCounts();

            long endTime = System.currentTimeMillis();
            log.info("================== 缓存预热完成，总耗时: {} ms ==================",
                    endTime - startTime);

        } catch (Exception e) {
            log.error("缓存预热失败，但不影响应用启动", e);
        }
    }

    /**
     * 预热博客列表缓存
     */
    private void warmUpBlogLists() {
        long start = System.currentTimeMillis();
        log.info("开始预热博客列表缓存...");

        try {
            // 预热热门博客列表（多个limit）
            blogService.getHotBlogs(6);
            blogService.getHotBlogs(10);
            log.debug("预热热门博客列表完成");

            // 预热最新博客列表（多个limit）
            blogService.getLatestBlogs(6);
            blogService.getLatestBlogs(10);
            blogService.getLatestBlogs(20);
            log.debug("预热最新博客列表完成");

            long elapsed = System.currentTimeMillis() - start;
            log.info("✓ 博客列表缓存预热完成，耗时: {} ms", elapsed);

        } catch (Exception e) {
            log.error("预热博客列表缓存失败", e);
        }
    }

    /**
     * 预热博客点赞数缓存
     */
    private void warmUpLikeCounts() {
        long start = System.currentTimeMillis();
        log.info("开始预热博客点赞数缓存...");

        try {
            // 获取所有已发布的博客ID
            List<Blog> publishedBlogs = blogMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Blog>()
                            .eq(Blog::getStatus, 1)
                            .select(Blog::getId));

            int count = 0;
            for (Blog blog : publishedBlogs) {
                try {
                    // 触发点赞数缓存（传入 blogId）
                    redisLikeService.getLikeCount(blog.getId());
                    count++;
                } catch (Exception e) {
                    log.warn("预热博客 {} 点赞数失败: {}", blog.getId(), e.getMessage());
                }
            }

            long elapsed = System.currentTimeMillis() - start;
            log.info("✓ 博客点赞数缓存预热完成，共 {} 篇，耗时: {} ms", count, elapsed);

        } catch (Exception e) {
            log.error("预热博客点赞数缓存失败", e);
        }
    }

    /**
     * 预热博客评论数缓存
     */
    private void warmUpCommentCounts() {
        long start = System.currentTimeMillis();
        log.info("开始预热博客评论数缓存...");

        try {
            // 获取所有已发布的博客ID
            List<Blog> publishedBlogs = blogMapper.selectList(
                    new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Blog>()
                            .eq(Blog::getStatus, 1)
                            .select(Blog::getId));

            int count = 0;
            for (Blog blog : publishedBlogs) {
                try {
                    // 触发评论数缓存
                    commentCountService.getCommentCount(blog.getId());
                    count++;
                } catch (Exception e) {
                    log.warn("预热博客 {} 评论数失败: {}", blog.getId(), e.getMessage());
                }
            }

            long elapsed = System.currentTimeMillis() - start;
            log.info("✓ 博客评论数缓存预热完成，共 {} 篇，耗时: {} ms", count, elapsed);

        } catch (Exception e) {
            log.error("预热博客评论数缓存失败", e);
        }
    }
}
