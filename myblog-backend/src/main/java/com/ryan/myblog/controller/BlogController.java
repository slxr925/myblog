package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.BlogSaveDTO;
import com.ryan.myblog.model.dto.LikeResultDTO;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogDetailEnhancedVO;
import com.ryan.myblog.model.vo.BlogListVO;
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
import java.util.concurrent.Executors;

/**
 * 博客控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogService blogService;
    private final SecurityUtils securityUtils;

    // 创建一个线程池用于并行执行任务
    private final Executor executor = Executors.newFixedThreadPool(4);
    
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
     * 查询博客详情
     */
    @GetMapping("/{id}")
    public Result<BlogDetailVO> getBlogDetail(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            BlogDetailVO blog = blogService.getBlogDetail(id, userId);
            // 增加阅读量
            blogService.incrementViewCount(id);
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

            CompletableFuture<List<BlogDetailVO>> categoryBlogsFuture = blog.getCategoryId() != null ?
                CompletableFuture.supplyAsync(() -> blogService.getBlogsByCategory(blog.getCategoryId(), 5), executor) :
                CompletableFuture.completedFuture(null);

            // 等待所有任务完成，设置超时时间为5秒
            CompletableFuture<Void> allFutures = CompletableFuture.allOf(
                relatedBlogsFuture, previousBlogFuture, nextBlogFuture,
                hotBlogsFuture, latestBlogsFuture, categoryBlogsFuture
            );

            allFutures.get(5, TimeUnit.SECONDS);

            // 设置结果
            enhancedVO.setRelatedBlogs(relatedBlogsFuture.get());
            enhancedVO.setPreviousBlog(previousBlogFuture.get());
            enhancedVO.setNextBlog(nextBlogFuture.get());
            enhancedVO.setHotBlogs(hotBlogsFuture.get());
            enhancedVO.setLatestBlogs(latestBlogsFuture.get());

            if (blog.getCategoryId() != null) {
                enhancedVO.setCategoryBlogs(categoryBlogsFuture.get());
            }

        } catch (Exception e) {
            log.error("并行获取博客详情数据失败", e);
            // 如果并行调用失败，降级到串行调用
            enhancedVO.setRelatedBlogs(blogService.getRelatedBlogs(id, 5));
            enhancedVO.setPreviousBlog(blogService.getPreviousBlog(id, blog.getCategoryId()));
            enhancedVO.setNextBlog(blogService.getNextBlog(id, blog.getCategoryId()));
            enhancedVO.setHotBlogs(blogService.getHotBlogs(5));
            enhancedVO.setLatestBlogs(blogService.getLatestBlogs(5));

            if (blog.getCategoryId() != null) {
                enhancedVO.setCategoryBlogs(blogService.getBlogsByCategory(blog.getCategoryId(), 5));
            }
        }

        return Result.success(enhancedVO);
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
    public Result<Void> deleteBlog(@PathVariable Long id) {
        Long authorId = getCurrentUserId();
        blogService.deleteBlog(id, authorId);
        return Result.success();
    }
    
    /**
     * 点赞/取消点赞
     */
    @PostMapping("/{id}/like")
    public Result<Boolean> toggleLike(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        Boolean isLiked = blogService.toggleLike(id, userId);
        return Result.success(isLiked);
    }

    /**
     * 点赞/取消点赞（返回详细信息）
     */
    @PostMapping("/{id}/like/details")
    public Result<LikeResultDTO> toggleLikeWithDetails(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        LikeResultDTO result = blogService.toggleLikeWithDetails(id, userId);
        return Result.success(result);
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