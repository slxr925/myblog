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
import com.ryan.myblog.model.vo.BlogLegacyRedirectVO;
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
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

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
            @RequestParam(defaultValue = "1") Integer status,
            @RequestParam(defaultValue = "latest") String sort,
            @RequestParam(defaultValue = "all") String timeRange) {

        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        pageRequest.setSort(sort);
        pageRequest.setTimeRange(timeRange);

        IPage<BlogDetailVO> result = blogService.getBlogPage(pageRequest, categoryId, tagId, keyword, 1, sort,
                timeRange);
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
     * 查询公开博客详情
     */
    @GetMapping("/public/{publicId}")
    public Result<BlogDetailVO> getPublicBlogDetail(@PathVariable String publicId) {
        Long userId = getOptionalCurrentUserId();
        BlogDetailVO blog = blogService.getPublicBlogDetail(publicId, userId);
        blogService.incrementViewCount(blog.getId());
        if (userId != null) {
            browseHistoryService.recordBrowse(userId, blog.getId());
        }
        return Result.success(blog);
    }

    /**
     * 兼容旧的数字文章链接，解析到新的公开UUID
     */
    @GetMapping("/legacy/{id}/redirect")
    public Result<BlogLegacyRedirectVO> resolveLegacyBlogLink(@PathVariable Long id) {
        return Result.success(new BlogLegacyRedirectVO(blogService.resolveLegacyPublicId(id)));
    }

    /**
     * 查询内部博客详情（不增加浏览量）
     * 用于编辑器/后台预览
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Result<BlogDetailVO> getInternalBlogDetail(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return Result.success(blogService.getInternalBlogDetail(id, userId));
    }

    /**
     * 查询内部博客详情（不增加浏览量）
     * 用于点赞等操作后获取最新数据
     */
    @GetMapping("/{id}/detail")
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
    public Result<BlogDetailVO> getBlogDetailWithoutIncrement(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        return Result.success(blogService.getInternalBlogDetail(id, userId));
    }

    /**
     * 查询增强版博客详情（包含推荐内容）
     * 使用并行调用优化性能
     */
    @GetMapping("/public/{publicId}/enhanced")
    public Result<BlogDetailEnhancedVO> getPublicBlogDetailEnhanced(@PathVariable String publicId) {
        Long userId = getOptionalCurrentUserId();

        BlogDetailVO blog = blogService.getPublicBlogDetail(publicId, userId);
        Long blogId = blog.getId();

        // 增加阅读量（异步执行，不阻塞）
        CompletableFuture.runAsync(() -> {
            try {
                blogService.incrementViewCount(blogId);
            } catch (Exception e) {
                log.warn("增加阅读量失败: {}", e.getMessage());
            }
        }, executor);

        if (userId != null) {
            CompletableFuture.runAsync(() -> browseHistoryService.recordBrowse(userId, blogId), executor);
        }

        // 构建增强版详情
        BlogDetailEnhancedVO enhancedVO = new BlogDetailEnhancedVO();
        enhancedVO.setBlog(blog);

        // 并行获取相关数据
        try {
            // 并行执行多个查询
            CompletableFuture<List<BlogDetailVO>> relatedBlogsFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getRelatedBlogs(blogId, 5), executor);

            CompletableFuture<BlogDetailVO> previousBlogFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getPreviousBlog(blogId, blog.getCategoryId()), executor);

            CompletableFuture<BlogDetailVO> nextBlogFuture = CompletableFuture.supplyAsync(
                    () -> blogService.getNextBlog(blogId, blog.getCategoryId()), executor);

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
                    "热门推荐", "hot", hotBlogsFuture.get(), blogId, 5));

        } catch (Exception e) {
            log.error("并行获取博客详情数据失败", e);
            // 如果并行调用失败，降级到串行调用
            enhancedVO.setRelatedBlogs(blogService.getRelatedBlogs(blogId, 5));
            enhancedVO.setPreviousBlog(blogService.getPreviousBlog(blogId, blog.getCategoryId()));
            enhancedVO.setNextBlog(blogService.getNextBlog(blogId, blog.getCategoryId()));
            enhancedVO.setHotBlogs(blogService.getHotBlogs(5));
            enhancedVO.setLatestBlogs(blogService.getLatestBlogs(5));
            enhancedVO.setRelatedSection(buildRecommendationSection(
                    "相关推荐", "related", enhancedVO.getRelatedBlogs(),
                    "热门推荐", "hot", enhancedVO.getHotBlogs(), blogId, 5));
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
            recommendation.setPublicId(item.getPublicId());
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
        clearBlogDetailCaches(id);
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
        clearBlogDetailCaches(id);
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
    @PreAuthorize("hasAnyRole('ADMIN','USER')")
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
     * 全站 RSS Feed
     */
    @org.springframework.beans.factory.annotation.Value("${app.site-url:}")
    private String siteUrl;

    @GetMapping(value = "/rss.xml", produces = "application/rss+xml; charset=UTF-8")
    public ResponseEntity<String> getRssFeed() {
        List<BlogDetailVO> blogs = blogService.getLatestBlogs(20);
        String baseUrl = resolveSiteBaseUrl();
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        xml.append("<?xml-stylesheet type=\"text/xsl\" href=\"rss.xsl\"?>");
        xml.append("<rss version=\"2.0\"><channel>");
        xml.append("<title>").append(escapeXml("Ryan's Blog")).append("</title>");
        xml.append("<link>").append(escapeXml(baseUrl)).append("</link>");
        xml.append("<description>").append(escapeXml("最新发布的技术文章与项目实践")).append("</description>");
        xml.append("<language>zh-CN</language>");

        for (BlogDetailVO blog : blogs) {
            String blogUrl = baseUrl + "/blog/" + blog.getPublicId();
            String pubDate = blog.getPublishTime() != null
                    ? blog.getPublishTime().atZone(ZoneId.of("Asia/Shanghai")).format(DateTimeFormatter.RFC_1123_DATE_TIME)
                    : null;
            xml.append("<item>");
            xml.append("<title>").append(escapeXml(blog.getTitle())).append("</title>");
            xml.append("<link>").append(escapeXml(blogUrl)).append("</link>");
            xml.append("<guid>").append(escapeXml(blogUrl)).append("</guid>");
            xml.append("<description>").append(escapeXml(resolveSummary(blog))).append("</description>");
            if (blog.getAuthorName() != null) {
                xml.append("<author>").append(escapeXml(blog.getAuthorName())).append("</author>");
            }
            if (blog.getCategoryName() != null) {
                xml.append("<category>").append(escapeXml(blog.getCategoryName())).append("</category>");
            }
            if (pubDate != null) {
                xml.append("<pubDate>").append(escapeXml(pubDate)).append("</pubDate>");
            }
            xml.append("</item>");
        }

        xml.append("</channel></rss>");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "application/rss+xml; charset=UTF-8")
                .body(xml.toString());
    }

    /**
     * RSS 浏览器样式表：让直接打开 rss.xml 时渲染为可读页面
     */
    @GetMapping(value = "/rss.xsl", produces = "text/xsl; charset=UTF-8")
    public ResponseEntity<String> getRssStylesheet() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "text/xsl; charset=UTF-8")
                .body(RSS_STYLESHEET);
    }

    /**
     * 站点绝对地址：优先使用配置的 app.site-url，否则回退到当前请求上下文
     */
    private String resolveSiteBaseUrl() {
        if (siteUrl != null && !siteUrl.isBlank()) {
            String trimmed = siteUrl.trim();
            return trimmed.endsWith("/") ? trimmed.substring(0, trimmed.length() - 1) : trimmed;
        }
        return ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
    }

    /**
     * RSS 摘要：优先文章摘要，缺失时从正文提取纯文本兜底
     * （列表查询不含 content，需按 id 补查）
     */
    private String resolveSummary(BlogDetailVO blog) {
        if (blog.getSummary() != null && !blog.getSummary().isBlank()) {
            return blog.getSummary();
        }
        String content = blog.getContent();
        if ((content == null || content.isBlank()) && blog.getId() != null) {
            Blog entity = blogMapper.selectById(blog.getId());
            content = entity != null ? entity.getContent() : null;
        }
        if (content == null || content.isBlank()) {
            return "";
        }
        String plain = content
                .replaceAll("(?s)```.*?```", " ")
                .replaceAll("!\\[[^]]*\\]\\([^)]*\\)", " ")
                .replaceAll("\\[([^]]*)\\]\\([^)]*\\)", "$1")
                .replaceAll("[#>*`~_|-]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return plain.length() > 160 ? plain.substring(0, 160) + "…" : plain;
    }

    private static final String RSS_STYLESHEET = """
            <?xml version="1.0" encoding="UTF-8"?>
            <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
              <xsl:output method="html" encoding="UTF-8" indent="yes"/>
              <xsl:template match="/">
                <html lang="zh-CN">
                  <head>
                    <meta charset="UTF-8"/>
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <title><xsl:value-of select="rss/channel/title"/> · RSS</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; background: #faf9f7; color: #1c1a17; line-height: 1.7; }
                      .shell { max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem 4rem; }
                      .kicker { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #7c5a2e; margin-bottom: 1rem; }
                      h1 { font-size: 2rem; letter-spacing: -0.02em; }
                      .desc { color: #6b675f; margin-top: .75rem; }
                      .tip { margin-top: 2rem; padding: 1rem 1.25rem; border: 1px solid #e3dfd6; background: #fff; font-size: .9rem; color: #6b675f; }
                      .tip code { background: #f0ede6; padding: .1rem .4rem; font-size: .85rem; word-break: break-all; }
                      .item { padding: 1.75rem 0; border-bottom: 1px solid #e3dfd6; }
                      .item h2 { font-size: 1.2rem; }
                      .item h2 a { color: inherit; text-decoration: none; }
                      .item h2 a:hover { color: #7c5a2e; }
                      .meta { font-size: .8rem; color: #6b675f; margin-top: .35rem; }
                      .summary { color: #44403a; font-size: .95rem; margin-top: .6rem; }
                    </style>
                  </head>
                  <body>
                    <div class="shell">
                      <p class="kicker">RSS Feed</p>
                      <h1><xsl:value-of select="rss/channel/title"/></h1>
                      <p class="desc"><xsl:value-of select="rss/channel/description"/></p>
                      <div class="tip">
                        这是一个 RSS 订阅源，用于在阅读器（Feedly / Inoreader / NetNewsWire 等）中订阅。
                        把当前地址 <code><xsl:value-of select="rss/channel/link"/>/api/blog/rss.xml</code> 粘贴到你的 RSS 阅读器即可。
                      </div>
                      <xsl:for-each select="rss/channel/item">
                        <div class="item">
                          <h2><a href="{link}"><xsl:value-of select="title"/></a></h2>
                          <p class="meta">
                            <xsl:value-of select="author"/>
                            <xsl:if test="category"> · <xsl:value-of select="category"/></xsl:if>
                            <xsl:if test="pubDate"> · <xsl:value-of select="pubDate"/></xsl:if>
                          </p>
                          <p class="summary"><xsl:value-of select="description"/></p>
                        </div>
                      </xsl:for-each>
                    </div>
                  </body>
                </html>
              </xsl:template>
            </xsl:stylesheet>
            """;

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

    private Long getOptionalCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }

    private void clearBlogDetailCaches(Long blogId) {
        Blog blog = blogMapper.selectById(blogId);
        if (blog != null && blog.getPublicId() != null) {
            unifiedCacheService.delete(RedisKeyFactory.BLOG_PUBLIC_DETAIL, blog.getPublicId());
        }
        unifiedCacheService.delete(RedisKeyFactory.BLOG_INTERNAL_DETAIL, blogId);
    }

    private String escapeXml(String value) {
        return value == null ? "" : value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }
}
