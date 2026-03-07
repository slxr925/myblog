package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.BlogSaveDTO;
import com.ryan.myblog.model.dto.LikeResultDTO;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.UnifiedCacheService;
import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogDetailEnhancedVO;
import com.ryan.myblog.model.vo.BlogRecommendationVO;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.model.vo.RecommendationSectionVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.mapper.BlogMapper;
import java.util.ArrayList;
import java.util.LinkedHashSet;

/**
 * 博客控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final com.ryan.myblog.service.RedisLikeService redisLikeService;
    private final com.ryan.myblog.service.CacheService cacheService;
    private final UnifiedCacheService unifiedCacheService;
    private final BlogMapper blogMapper;
    private final com.ryan.myblog.service.BrowseHistoryService browseHistoryService;
    private final com.ryan.myblog.service.BlogRevisionService blogRevisionService;

    // 注入 Spring 管理的线程池（避免内存泄漏）
    // 原来使用 Executors.newFixedThreadPool(4) 创建的线程池不会被Spring管理
    // 应用关闭时不会自动 shutdown，导致线程无法释放
    @Autowired
    @Qualifier("blogAsyncExecutor")
    private Executor executor;

    /**
     * 分页查询博客列表
     */
    @GetMapping("/page")
    public Result<IPage<BlogDetailVO>> getBlogPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer status) {

        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);

        IPage<BlogDetailVO> result = blogService.getBlogPage(pageRequest, categoryId, tagId, keyword, status);
        return Result.success(result);
    }

    /**
     * 获取关注流
     */
    @GetMapping("/following")
    @PreAuthorize("isAuthenticated()")
    public Result<IPage<BlogDetailVO>> getFollowingFeed(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        Long userId = getCurrentUserId();
        return Result.success(blogService.getFollowingFeed(pageRequest, userId));
    }

    /**
     * 查询博客详情
     */
    @GetMapping("/{id}")
    public Result<BlogDetailVO> getBlogDetail(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            BlogDetailVO blog = blogService.getBlogDetail(id, userId);
            // 增加阅读量
            blogService.incrementViewCount(id);
            // 记录浏览历史（仅登录用户）
            if (userId != null) {
                browseHistoryService.recordBrowse(userId, id);
            }
            return Result.success(blog);
        } catch (Exception e) {
            // 如果用户未登录，使用普通查询
            BlogDetailVO blog = blogService.getBlogDetail(id);
            blogService.incrementViewCount(id);
            return Result.success(blog);
        }
    }

    /**
     * 查询博客详情（不增加浏览量）
     * 用于点赞等操作后获取最新数据
     */
    @GetMapping("/{id}/detail")
    public Result<BlogDetailVO> getBlogDetailWithoutIncrement(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            BlogDetailVO blog = blogService.getBlogDetail(id, userId);
            return Result.success(blog);
        } catch (Exception e) {
            // 如果用户未登录，使用普通查询
            BlogDetailVO blog = blogService.getBlogDetail(id);
            return Result.success(blog);
        }
    }

    /**
     * 查询增强版博客详情（包含推荐内容）
     * 使用并行调用优化性能
     */
    @GetMapping("/{id}/enhanced")
    public Result<BlogDetailEnhancedVO> getBlogDetailEnhanced(@PathVariable Long id) {

        // 获取博客详情
        BlogDetailVO blog = blogService.getBlogDetail(id);
        if (blog == null) {
            return Result.error("博客不存在");
        }

        // 增加阅读量（异步执行，不阻塞）
        CompletableFuture.runAsync(() -> {
            try {
                blogService.incrementViewCount(id);
            } catch (Exception e) {
                log.warn("增加阅读量失败: {}", e.getMessage());
            }
        }, executor);

        // 构建增强版详情
        BlogDetailEnhancedVO enhancedVO = new BlogDetailEnhancedVO();
        enhancedVO.setBlog(blog);

        // 并行获取相关数据
        try {
            // 并行执行多个查询
            CompletableFuture<List<BlogDetailVO>> relatedBlogsFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getRelatedBlogs(id, 5), executor);

            CompletableFuture<BlogDetailVO> previousBlogFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getPreviousBlog(id, blog.getCategoryId()), executor);

            CompletableFuture<BlogDetailVO> nextBlogFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getNextBlog(id, blog.getCategoryId()), executor);

            CompletableFuture<List<BlogDetailVO>> hotBlogsFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getHotBlogs(5), executor);

            CompletableFuture<List<BlogDetailVO>> latestBlogsFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getLatestBlogs(5), executor);

            // 等待所有任务完成，设置超时时间为5秒
            CompletableFuture<Void> allFutures = CompletableFuture.allOf(
                    relatedBlogsFuture, previousBlogFuture, nextBlogFuture,
                    hotBlogsFuture, latestBlogsFuture);

            allFutures.get(5, TimeUnit.SECONDS);

            // 设置结果
            enhancedVO.setRelatedBlogs(relatedBlogsFuture.get());
            enhancedVO.setPreviousBlog(previousBlogFuture.get());
            enhancedVO.setNextBlog(nextBlogFuture.get());
            enhancedVO.setHotBlogs(hotBlogsFuture.get());
            enhancedVO.setLatestBlogs(latestBlogsFuture.get());
            enhancedVO.setRelatedSection(buildRecommendationSection(
                    "相关推荐", "related", relatedBlogsFuture.get(),
                    "热门推荐", "hot", hotBlogsFuture.get(), id, 5));

        } catch (Exception e) {
            log.error("并行获取博客详情数据失败", e);
            // 如果并行调用失败，降级到串行调用
            enhancedVO.setRelatedBlogs(blogService.getRelatedBlogs(id, 5));
            enhancedVO.setPreviousBlog(blogService.getPreviousBlog(id, blog.getCategoryId()));
            enhancedVO.setNextBlog(blogService.getNextBlog(id, blog.getCategoryId()));
            enhancedVO.setHotBlogs(blogService.getHotBlogs(5));
            enhancedVO.setLatestBlogs(blogService.getLatestBlogs(5));
            enhancedVO.setRelatedSection(buildRecommendationSection(
                    "相关推荐", "related", enhancedVO.getRelatedBlogs(),
                    "热门推荐", "hot", enhancedVO.getHotBlogs(), id, 5));
        }

        return Result.success(enhancedVO);
    }

    private RecommendationSectionVO buildRecommendationSection(
            String primaryTitle,
            String primarySource,
            List<BlogDetailVO> primaryItems,
            String fallbackTitle,
            String fallbackSource,
            List<BlogDetailVO> fallbackItems,
            Long currentBlogId,
            int limit) {
        List<BlogRecommendationVO> primary = toRecommendationItems(primaryItems, currentBlogId, limit);
        RecommendationSectionVO section = new RecommendationSectionVO();
        if (!primary.isEmpty()) {
            section.setTitle(primaryTitle);
            section.setSource(primarySource);
            section.setItems(primary);
            return section;
        }

        section.setTitle(fallbackTitle);
        section.setSource(fallbackSource);
        section.setItems(toRecommendationItems(fallbackItems, currentBlogId, limit));
        return section;
    }

    private List<BlogRecommendationVO> toRecommendationItems(List<BlogDetailVO> items, Long currentBlogId, int limit) {
        if (items == null || items.isEmpty()) {
            return List.of();
        }

        LinkedHashSet<Long> seenIds = new LinkedHashSet<>();
        List<BlogRecommendationVO> result = new ArrayList<>();
        for (BlogDetailVO item : items) {
            if (item == null || item.getId() == null || item.getId().equals(currentBlogId) || !seenIds.add(item.getId())) {
                continue;
            }

            BlogRecommendationVO recommendation = new BlogRecommendationVO();
            recommendation.setId(item.getId());
            recommendation.setTitle(item.getTitle());
            recommendation.setCategoryId(item.getCategoryId());
            recommendation.setCategoryName(item.getCategoryName());
            recommendation.setPublishTime(item.getPublishTime());
            result.add(recommendation);

            if (result.size() >= limit) {
                break;
            }
        }
        return result;
    }

    /**
     * 保存博客
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BlogDetailVO> saveBlog(@Validated @RequestBody BlogSaveDTO blogSaveDTO) {
        Long authorId = getCurrentUserId();
        BlogDetailVO blogDetailVO = blogService.saveBlog(blogSaveDTO, authorId);
        return Result.success(blogDetailVO);
    }

    /**
     * 更新博客
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<BlogDetailVO> updateBlog(@PathVariable Long id,
            @Validated @RequestBody BlogSaveDTO blogSaveDTO) {
        Long authorId = getCurrentUserId();
        BlogDetailVO blogDetailVO = blogService.updateBlog(id, blogSaveDTO, authorId);
        return Result.success(blogDetailVO);
    }

    /**
     * 删除博客
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @com.ryan.myblog.annotation.AuditLog(action = "DELETE", resource = "BLOG")
    public Result<Void> deleteBlog(@PathVariable Long id) {
        Long authorId = getCurrentUserId();
        blogService.deleteBlog(id, authorId);
        return Result.success();
    }

    /**
     * 获取博客版本历史
     */
    @GetMapping("/{id}/revisions")
    @PreAuthorize("isAuthenticated()")
    public Result<java.util.List<com.ryan.myblog.model.vo.BlogRevisionVO>> listRevisions(@PathVariable Long id) {
        return Result.success(blogRevisionService.listRevisions(id));
    }

    /**
     * 版本对比
     */
    @GetMapping("/{id}/diff")
    @PreAuthorize("isAuthenticated()")
    public Result<com.ryan.myblog.model.vo.BlogRevisionDiffVO> diffRevisions(
            @PathVariable Long id,
            @RequestParam Long from,
            @RequestParam Long to) {
        return Result.success(blogRevisionService.diffRevisions(from, to));
    }

    /**
     * 回滚版本
     */
    @PostMapping("/{id}/revisions/{revisionId}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> restoreRevision(@PathVariable Long id, @PathVariable Long revisionId) {
        Long operatorId = getCurrentUserId();
        blogRevisionService.restoreRevision(revisionId, operatorId);
        return Result.success();
    }

    /**
     * 点赞/取消点赞
     * 
     * 优化说明：
     * - 原方案：直接操作数据库，存在并发问题，QPS约1000
     * - 新方案：使用Redis原子操作，异步持久化，QPS可达30000+
     * - API接口保持不变，对前端透明
     */
    @PostMapping("/{id}/like")
    public Result<Boolean> toggleLike(@PathVariable Long id) {
        Long userId = getCurrentUserId();

        // 使用Redis优化的点赞服务
        Boolean isLiked = redisLikeService.toggleLike(id, userId);

        // 清除相关缓存（保持原有逻辑）
        unifiedCacheService.delete(RedisKeyFactory.BLOG_DETAIL, id);
        cacheService.deleteByPattern("blog:page:*");

        return Result.success(isLiked);
    }

    /**
     * 点赞/取消点赞（返回详细信息）
     * 
     * 优化说明：
     * - 原方案：直接操作数据库，QPS约1000
     * - 新方案：使用Redis原子操作，QPS可达30000+
     * - 统一使用 redisLikeService，保持与 toggleLike 一致
     */
    @PostMapping("/{id}/like/details")
    public Result<LikeResultDTO> toggleLikeWithDetails(@PathVariable Long id) {
        Long userId = getCurrentUserId();

        // 1. 使用 Redis 服务切换点赞状态
        Boolean isLiked = redisLikeService.toggleLike(id, userId);

        // 2. 从 Redis 获取点赞数
        Long likeCount = redisLikeService.getLikeCount(id);

        // 3. 获取浏览数（浏览数不需要高并发，从数据库读取）
        Blog blog = blogMapper.selectById(id);
        Integer viewCount = blog != null ? blog.getViewCount() : 0;

        // 4. 清除相关缓存
        unifiedCacheService.delete(RedisKeyFactory.BLOG_DETAIL, id);
        cacheService.deleteByPattern("blog:page:*");

        return Result.success(new LikeResultDTO(isLiked, likeCount.intValue(), viewCount));
    }

    /**
     * 发布博客
     */
    @PostMapping("/{id}/publish")
    public Result<Void> publishBlog(@PathVariable Long id) {
        Long authorId = getCurrentUserId();
        blogService.publishBlog(id, authorId);
        return Result.success();
    }

    /**
     * 下线博客
     */
    @PostMapping("/{id}/unpublish")
    public Result<Void> unpublishBlog(@PathVariable Long id) {
        Long authorId = getCurrentUserId();
        blogService.unpublishBlog(id, authorId);
        return Result.success();
    }

    /**
     * 获取热门博客
     */
    @GetMapping("/hot")
    public Result<List<BlogDetailVO>> getHotBlogs(@RequestParam(defaultValue = "10") Integer limit) {
        List<BlogDetailVO> hotBlogs = blogService.getHotBlogs(limit);
        return Result.success(hotBlogs);
    }

    /**
     * 获取最新博客
     */
    @GetMapping("/latest")
    public Result<List<BlogDetailVO>> getLatestBlogs(@RequestParam(defaultValue = "10") Integer limit) {
        List<BlogDetailVO> latestBlogs = blogService.getLatestBlogs(limit);
        return Result.success(latestBlogs);
    }

    /**
     * 个性化推荐
     */
    @GetMapping("/recommend")
    public Result<List<BlogDetailVO>> getRecommended(@RequestParam(defaultValue = "10") Integer limit) {
        Long userId = getCurrentUserId();
        return Result.success(blogService.getRecommendedBlogs(userId, limit));
    }

    /**
     * 根据分类获取博客
     */
    @GetMapping("/category/{categoryId}")
    public Result<List<BlogDetailVO>> getBlogsByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<BlogDetailVO> blogs = blogService.getBlogsByCategory(categoryId, limit);
        return Result.success(blogs);
    }

    /**
     * 获取相关推荐博客
     */
    @GetMapping("/{id}/related")
    public Result<List<BlogDetailVO>> getRelatedBlogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "5") Integer limit) {
        List<BlogDetailVO> relatedBlogs = blogService.getRelatedBlogs(id, limit);
        return Result.success(relatedBlogs);
    }

    /**
     * 获取所有公开文章
     */
    @GetMapping("/public/all")
    public Result<List<BlogListVO>> getAllPublicBlogs() {
        List<BlogListVO> allPublicBlogs = blogService.getAllPublicBlogs();
        return Result.success(allPublicBlogs);
    }

    /**
     * 搜索所有公开博客文章
     */
    @GetMapping("/search")
    public Result<List<BlogListVO>> searchBlogs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<BlogListVO> searchResults = blogService.searchBlogs(keyword, limit);
        return Result.success(searchResults);
    }

    /**
     * 根据标签搜索博客文章
     */
    @GetMapping("/search/by-tag")
    public Result<List<BlogListVO>> searchBlogsByTag(
            @RequestParam String tagName,
            @RequestParam(defaultValue = "10") Integer limit) {
        List<BlogListVO> searchResults = blogService.searchBlogsByTag(tagName, limit);
        return Result.success(searchResults);
    }

    /**
     * 获取当前作者的文章列表
     */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Result<IPage<BlogDetailVO>> getMyBlogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        Long authorId = getCurrentUserId();
        IPage<BlogDetailVO> result = blogService.getBlogsByAuthor(pageRequest, authorId, status);
        return Result.success(result);
    }

    /**
     * 获取当前作者的草稿列表
     */
    @GetMapping("/drafts")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Result<List<BlogDetailVO>> getMyDrafts() {
        Long authorId = getCurrentUserId();
        List<BlogDetailVO> drafts = blogService.getDraftsByAuthor(authorId);
        return Result.success(drafts);
    }

    /**
     * 获取当前登录用户点赞的博客列表
     */
    @GetMapping("/liked/my")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Result<IPage<BlogDetailVO>> getMyLikedBlogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        Long userId = getCurrentUserId();
        IPage<BlogDetailVO> result = blogService.getLikedBlogsByUser(pageRequest, userId);
        return Result.success(result);
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new RuntimeException("用户未登录");
    }
}
