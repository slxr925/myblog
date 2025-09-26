package com.ryan.myblog.utils;

import com.ryan.myblog.common.Role;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * 用户角色工具类
 */
public class UserRoleUtils {
    
    /**
     * 获取当前用户的角色
     */
    public static Role getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Role.USER; // 默认返回普通用户角色
        }
        
        Object principal = authentication.getPrincipal();
        if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
            org.springframework.security.core.userdetails.UserDetails userDetails = 
                (org.springframework.security.core.userdetails.UserDetails) principal;
            
            // 从权限中提取角色信息
            return userDetails.getAuthorities().stream()
                .filter(authority -> authority.getAuthority().startsWith("ROLE_"))
                .map(authority -> {
                    String roleStr = authority.getAuthority().substring(5); // 去掉"ROLE_"前缀
                    try {
                        return Role.valueOf(roleStr.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        return Role.USER;
                    }
                })
                .findFirst()
                .orElse(Role.USER);
        }
        
        return Role.USER;
    }
    
    /**
     * 检查当前用户是否为管理员
     */
    public static boolean isAdmin() {
        return getCurrentUserRole() == Role.ADMIN;
    }
    
    /**
     * 检查当前用户是否为普通用户
     */
    public static boolean isUser() {
        return getCurrentUserRole() == Role.USER;
    }
    
    /**
     * 检查当前用户是否有指定角色
     */
    public static boolean hasRole(Role role) {
        return getCurrentUserRole() == role;
    }
}