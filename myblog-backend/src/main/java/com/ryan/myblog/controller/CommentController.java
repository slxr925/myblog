package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.CommentSaveDTO;
import com.ryan.myblog.service.CommentService;
import com.ryan.myblog.model.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 评论控制器
 */
@RestController
@RequestMapping("/api/comment")
@RequiredArgsConstructor
public class CommentController {
    
    private final CommentService commentService;
    
    /**
     * 发布评论
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Result<Void> saveComment(@Validated @RequestBody CommentSaveDTO commentSaveDTO) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Result.error(401, "用户未登录");
            }
            commentService.saveComment(commentSaveDTO, userId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取博客评论列表（树形结构）
     */
    @GetMapping("/tree/{blogId}")
    public Result<List<CommentVO>> getCommentTree(@PathVariable Long blogId,
                                                 @RequestParam(defaultValue = "1") Integer status) {
        List<CommentVO> comments = commentService.getCommentTree(blogId, status);
        return Result.success(comments);
    }
    
    /**
     * 获取博客的评论列表（兼容前端API调用）
     */
    @GetMapping("/blog/{blogId}")
    public Result<IPage<CommentVO>> getCommentsByBlogId(@PathVariable Long blogId,
                                                        @RequestParam(defaultValue = "1") Integer page,
                                                        @RequestParam(defaultValue = "10") Integer size,
                                                        @RequestParam(required = false) Integer status) {

        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);

        IPage<CommentVO> result = commentService.getCommentPage(pageRequest, blogId, status != null ? status : 1, null);
        return Result.success(result);
    }

    /**
     * 分页查询评论列表
     */
    @GetMapping("/page")
    public Result<IPage<CommentVO>> getCommentPage(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam Long blogId,
            @RequestParam(required = false) Integer status) {

        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);

        IPage<CommentVO> result = commentService.getCommentPage(pageRequest, blogId, status != null ? status : 1, null);
        return Result.success(result);
    }
    
    /**
     * 审核评论（管理员功能）
     */
    @PostMapping("/{id}/audit")
    @PreAuthorize("hasRole('ADMIN')")
    @com.ryan.myblog.annotation.AuditLog(action = "AUDIT", resource = "COMMENT")
    public Result<Void> auditComment(@PathVariable Long id,
                                   @RequestParam Integer status) {
        try {
            Long operatorId = getCurrentUserId();
            if (operatorId == null) {
                return Result.error(401, "用户未登录");
            }
            commentService.auditComment(id, status, operatorId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 删除评论
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> deleteComment(@PathVariable Long id) {
        try {
            Long operatorId = getCurrentUserId();
            if (operatorId == null) {
                return Result.error(401, "用户未登录");
            }
            commentService.deleteComment(id, operatorId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 点赞/取消点赞评论
     */
    @PostMapping("/{id}/like")
    @PreAuthorize("isAuthenticated()")
    public Result<Void> toggleCommentLike(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Result.error(401, "用户未登录");
            }
            commentService.toggleCommentLike(id, userId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
    
    /**
     * 获取评论详情
     */
    @GetMapping("/{id}")
    public Result<CommentVO> getCommentById(@PathVariable Long id) {
        CommentVO comment = commentService.getCommentById(id);
        if (comment == null) {
            return Result.error("评论不存在");
        }
        return Result.success(comment);
    }
    
    /**
     * 获取当前用户的评论列表
     */
    @GetMapping("/user/my")
    @PreAuthorize("isAuthenticated()")
    public Result<IPage<CommentVO>> getMyComments(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Long userId = getCurrentUserId();
            if (userId == null) {
                return Result.error(401, "用户未登录");
            }

            PageRequest pageRequest = new PageRequest();
            pageRequest.setPage(page);
            pageRequest.setSize(size);

            IPage<CommentVO> result = commentService.getCommentsByUser(pageRequest, userId);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    /**
     * 统计博客评论数
     */
    @GetMapping("/count/{blogId}")
    public Result<Long> countComments(@PathVariable Long blogId) {
        Long count = commentService.countCommentsByBlogId(blogId);
        return Result.success(count);
    }
    
    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }
}
