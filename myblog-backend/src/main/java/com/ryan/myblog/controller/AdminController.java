package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.UserRoleUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员控制器
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    
    private final UserService userService;
    
    /**
     * 获取所有用户列表（仅管理员）
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<User>> getAllUsers() {
        // 这里需要实现获取所有用户的逻辑
        // 暂时返回空列表，需要根据实际业务实现
        return Result.success("获取用户列表成功", null);
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
     * 检查当前用户是否为管理员
     */
    @GetMapping("/check")
    public Result<Boolean> checkAdmin() {
        boolean isAdmin = UserRoleUtils.isAdmin();
        return Result.success("检查管理员权限成功", isAdmin);
    }
}