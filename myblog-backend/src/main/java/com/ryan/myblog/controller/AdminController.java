package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.AdminStatsDTO;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.VisitLog;
import com.ryan.myblog.mapper.VisitLogMapper;
import com.ryan.myblog.service.AdminStatsService;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CategoryService;
import com.ryan.myblog.service.CommentService;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.UserRoleUtils;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserService userService;
    private final AdminStatsService adminStatsService;
    private final VisitLogMapper visitLogMapper;
    private final BlogService blogService;
    private final CommentService commentService;
    private final CategoryService categoryService;
    private final TagService tagService;

    /**
     * 获取管理员统计数据
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<AdminStatsDTO> getStats() {
        try {
            AdminStatsDTO stats = adminStatsService.getAdminStats();
            return Result.success("获取统计数据成功", stats);
        } catch (Exception e) {
            log.error("获取统计数据失败", e);
            return Result.error("获取统计数据失败: " + e.getMessage());
        }
    }

    /**
     * 分页获取评论列表
     */
    @GetMapping("/comments")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<CommentVO>> getComments(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "12") Integer size,
            @RequestParam(required = false) Long blogId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);

        IPage<CommentVO> commentPage = commentService.getCommentPage(pageRequest, blogId, status, keyword);
        PageResult<CommentVO> pageResult = PageResult.of(
                commentPage.getRecords(),
                commentPage.getTotal(),
                commentPage.getCurrent(),
                commentPage.getSize()
        );
        return Result.success(pageResult);
    }

    /**
     * 删除评论
     */
    @DeleteMapping("/comments/{commentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteComment(@PathVariable Long commentId) {
        Long operatorId = SecurityUtils.getCurrentUserId();
        commentService.deleteComment(commentId, operatorId);
        return Result.success();
    }

    /**
     * 分页获取文章列表
     */
    @GetMapping("/blogs")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<BlogDetailVO>> getBlogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "12") Integer size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String keyword) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);

        IPage<BlogDetailVO> blogPage = blogService.getBlogPage(pageRequest, null, null, keyword, status);
        PageResult<BlogDetailVO> pageResult = PageResult.of(
                blogPage.getRecords(),
                blogPage.getTotal(),
                blogPage.getCurrent(),
                blogPage.getSize()
        );
        return Result.success(pageResult);
    }

    /**
     * 获取分类列表
     */
    @GetMapping("/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Category>> getCategories() {
        List<Category> categories = categoryService.getAllCategoriesWithCount();
        return Result.success(categories);
    }

    /**
     * 获取标签列表
     */
    @GetMapping("/tags")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<Tag>> getTags() {
        List<Tag> tags = tagService.getAllTags();
        return Result.success(tags);
    }

    /**
     * 更新文章状态
     */
    @PutMapping("/blogs/{blogId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateBlogStatus(@PathVariable Long blogId,
                                         @RequestBody Map<String, Integer> request) {
        Integer status = request.get("status");
        if (status == null) {
            return Result.error("状态值不能为空");
        }
        Long operatorId = SecurityUtils.getCurrentUserId();
        blogService.updateBlogStatus(blogId, status, operatorId);
        return Result.success();
    }

    /**
     * 删除文章
     */
    @DeleteMapping("/blogs/{blogId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteBlog(@PathVariable Long blogId) {
        Long operatorId = SecurityUtils.getCurrentUserId();
        blogService.deleteBlog(blogId, operatorId);
        return Result.success();
    }

    /**
     * 分页获取用户列表（仅管理员）
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<PageResult<User>> getUsers(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "12") Integer size,
            @RequestParam(required = false) String keyword) {
        try {
            log.info("管理员请求用户列表：page={}, size={}, keyword={}", page, size, keyword);

            // 创建分页请求
            PageRequest pageRequest = new PageRequest();
            pageRequest.setPage(page);
            pageRequest.setSize(size);

            // 调用服务层获取分页数据
            IPage<User> userPage = userService.getUserPage(pageRequest, keyword);

            // 添加详细日志调试
            log.info("MyBatis Plus返回的分页数据：current={}, size={}, total={}, records={}",
                userPage.getCurrent(), userPage.getSize(), userPage.getTotal(), userPage.getRecords().size());

            // 获取真实的总用户数
            Long actualTotal = userService.getTotalUserCount(keyword);

            // 转换为前端期望的分页结果格式
            PageResult<User> pageResult = new PageResult<>(
                userPage.getRecords(),
                actualTotal, // 使用真实的总用户数
                userPage.getCurrent(),
                userPage.getSize()
            );

            log.info("PageResult构造完成：total={}, records={}, pages={}",
                pageResult.getTotal(), pageResult.getRecords().size(), pageResult.getPages());
            return Result.success("获取用户列表成功", pageResult);

        } catch (Exception e) {
            log.error("获取用户列表失败", e);
            return Result.error("获取用户列表失败: " + e.getMessage());
        }
    }

    /**
     * 更新用户状态（仅管理员）
     */
    @PutMapping("/users/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<String> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer status = request.get("status");
            if (status == null || (status != 0 && status != 1)) {
                return Result.error("状态值无效，必须为0（正常）或1（禁用）");
            }

            log.info("管理员请求更新用户状态：userId={}, status={}", userId, status);
            userService.updateUserStatus(userId, status);

            String statusText = status == 0 ? "启用" : "禁用";
            log.info("成功更新用户状态：userId={}, status={}", userId, statusText);
            return Result.success("用户状态更新成功", null);

        } catch (Exception e) {
            log.error("更新用户状态失败：userId={}", userId, e);
            return Result.error("更新用户状态失败: " + e.getMessage());
        }
    }

    /**
     * 获取管理员仪表板数据
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Object> getDashboard() {
        // 返回管理员仪表板数据
        // 包括博客统计、用户统计等
        return Result.success("获取仪表板数据成功", null);
    }

    /**
     * 记录页面访问
     */
    @PostMapping("/track-visit")
    public Result<Void> trackVisit(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String page = request.get("page");
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            // 获取当前用户ID（如果已登录）
            Long userId = null;
            try {
                userId = SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
                // 用户未登录，userId保持为null
            }

            VisitLog visitLog = new VisitLog();
            visitLog.setPage(page);
            visitLog.setIpAddress(ipAddress);
            visitLog.setUserAgent(userAgent);
            visitLog.setUserId(userId);
            visitLog.setVisitTime(LocalDateTime.now());
            visitLog.setCreateTime(LocalDateTime.now());

            visitLogMapper.insert(visitLog);

            log.info("记录访问: page={}, ip={}, userId={}", page, ipAddress, userId);
            return Result.success();

        } catch (Exception e) {
            log.error("记录访问失败", e);
            return Result.error("记录访问失败");
        }
    }

    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * 检查当前用户是否为管理员
     */
    @GetMapping("/check")
    public Result<Boolean> checkAdmin() {
        boolean isAdmin = UserRoleUtils.isAdmin();
        return Result.success("检查管理员权限成功", isAdmin);
    }
}