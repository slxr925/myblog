package com.ryan.myblog.utils;

import com.ryan.myblog.entity.User;
import com.ryan.myblog.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 安全工具类
 *
 * 权限检查工具，提供统一的用户权限验证方法
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityUtils {

    private final UserService userService;

    /**
     * 获取当前用户ID
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new RuntimeException("用户未登录");
    }

    /**
     * 获取当前用户信息
     */
    public User getCurrentUser() {
        Long userId = getCurrentUserId();
        return userService.getUserById(userId);
    }

    /**
     * 检查用户是否是管理员
     */
    public boolean isAdmin() {
        try {
            User currentUser = getCurrentUser();
            return currentUser != null && currentUser.getRole() == 1;
        } catch (Exception e) {
            log.error("检查管理员权限失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 检查用户是否是资源所有者或管理员
     */
    public boolean isOwnerOrAdmin(Long resourceOwnerId) {
        if (resourceOwnerId == null) {
            return false;
        }

        try {
            Long currentUserId = getCurrentUserId();
            return currentUserId.equals(resourceOwnerId) || isAdmin();
        } catch (Exception e) {
            log.error("检查资源所有权失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 检查用户是否有权限操作博客
     * 管理员可以操作所有博客，普通用户只能操作自己的博客
     */
    public boolean hasBlogPermission(Long blogAuthorId) {
        return isOwnerOrAdmin(blogAuthorId);
    }

    /**
     * 检查用户是否有权限操作评论
     * 管理员可以操作所有评论，普通用户只能操作自己的评论
     */
    public boolean hasCommentPermission(Long commentUserId) {
        return isOwnerOrAdmin(commentUserId);
    }

    /**
     * 验证用户权限，如果不是所有者或管理员则抛出异常
     */
    public void validateOwnerOrAdmin(Long resourceOwnerId, String resourceType) {
        if (!isOwnerOrAdmin(resourceOwnerId)) {
            throw new RuntimeException("无权限操作此" + resourceType);
        }
    }

    /**
     * 验证管理员权限，如果不是管理员则抛出异常
     */
    public void validateAdmin(String operation) {
        if (!isAdmin()) {
            throw new RuntimeException("无权限执行此操作：" + operation);
        }
    }

    /**
     * 获取当前用户的角色信息
     */
    public String getCurrentUserRole() {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                return currentUser.getRole() == 1 ? "ADMIN" : "USER";
            }
        } catch (Exception e) {
            log.error("获取用户角色失败: {}", e.getMessage());
        }
        return "UNKNOWN";
    }

    /**
     * 记录安全相关操作日志
     */
    public void logSecurityEvent(String event, String details) {
        Long userId = null;
        String username = "anonymous";

        try {
            userId = getCurrentUserId();
            User user = getCurrentUser();
            if (user != null) {
                username = user.getUsername();
            }
        } catch (Exception e) {
            // 忽略获取用户信息时的异常
        }

        log.info("安全事件 - 用户ID: {}, 用户名: {}, 事件: {}, 详情: {}",
                userId, username, event, details);
    }
}