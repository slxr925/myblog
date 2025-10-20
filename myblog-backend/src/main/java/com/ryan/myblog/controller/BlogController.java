package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.BlogSaveDTO;
import com.ryan.myblog.model.dto.BlogUpdateDTO;
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
     */
    @GetMapping("/{id}/enhanced")
    public Result<BlogDetailEnhancedVO> getBlogDetailEnhanced(@PathVariable Long id) {

        // 获取博客详情
        BlogDetailVO blog = blogService.getBlogDetail(id);
        if (blog == null) {
            return Result.error("博客不存在");
        }

        // 增加阅读量
        blogService.incrementViewCount(id);

        // 构建增强版详情
        BlogDetailEnhancedVO enhancedVO = new BlogDetailEnhancedVO();
        enhancedVO.setBlog(blog);

        // 获取相关推荐
        enhancedVO.setRelatedBlogs(blogService.getRelatedBlogs(id, 5));

        // 获取上下篇导航
        enhancedVO.setPreviousBlog(blogService.getPreviousBlog(id, blog.getCategoryId()));
        enhancedVO.setNextBlog(blogService.getNextBlog(id, blog.getCategoryId()));

        // 获取热门和最新博客
        enhancedVO.setHotBlogs(blogService.getHotBlogs(5));
        enhancedVO.setLatestBlogs(blogService.getLatestBlogs(5));

        // 获取同分类推荐
        if (blog.getCategoryId() != null) {
            enhancedVO.setCategoryBlogs(blogService.getBlogsByCategory(blog.getCategoryId(), 5));
        }

        return Result.success(enhancedVO);
    }
    
    /**
     * 保存博客
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> saveBlog(@Validated @RequestBody BlogSaveDTO blogSaveDTO) {
        Long authorId = getCurrentUserId();
        blogService.saveBlog(blogSaveDTO, authorId);
        return Result.success();
    }
    
    /**
     * 更新博客
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateBlog(@PathVariable Long id,
                                  @Validated @RequestBody BlogSaveDTO blogSaveDTO) {
        Long authorId = getCurrentUserId();
        blogService.updateBlog(id, blogSaveDTO, authorId);
        return Result.success();
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