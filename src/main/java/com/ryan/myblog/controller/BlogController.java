package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.dto.BlogSaveDTO;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.vo.BlogDetailVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 博客控制器
 */
@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {
    
    private final BlogService blogService;
    
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
        BlogDetailVO blog = blogService.getBlogDetail(id);
        // 增加阅读量
        blogService.incrementViewCount(id);
        return Result.success(blog);
    }
    
    /**
     * 保存博客
     */
    @PostMapping
    public Result<Void> saveBlog(@Validated @RequestBody BlogSaveDTO blogSaveDTO) {
        Long authorId = getCurrentUserId();
        blogService.saveBlog(blogSaveDTO, authorId);
        return Result.success();
    }
    
    /**
     * 更新博客
     */
    @PutMapping("/{id}")
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
    public Result<Void> deleteBlog(@PathVariable Long id) {
        Long authorId = getCurrentUserId();
        blogService.deleteBlog(id, authorId);
        return Result.success();
    }
    
    /**
     * 点赞/取消点赞
     */
    @PostMapping("/{id}/like")
    public Result<Void> toggleLike(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        blogService.toggleLike(id, userId);
        return Result.success();
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