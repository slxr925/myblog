package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    private final JwtUtils jwtUtils;
    
    /**
     * 用户注册
     */
    @PostMapping("/register")
    public Result<Void> register(@Validated @RequestBody UserRegisterDTO userRegisterDTO) {
        userService.register(userRegisterDTO);
        return Result.success();
    }
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<String> login(@Validated @RequestBody UserLoginDTO userLoginDTO) {
        String token = userService.login(userLoginDTO);
        return Result.success(token);
    }
    
    /**
     * 获取当前用户信息
     */
    @GetMapping("/info")
    public Result<User> getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            User user = userService.getUserById(userId);
            // 清除敏感信息
            user.setPassword(null);
            return Result.success(user);
        }
        throw new RuntimeException("用户未登录");
    }
    
    /**
     * 更新用户信息
     */
    @PutMapping("/info")
    public Result<Void> updateUserInfo(@RequestBody User user) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            user.setId(userId);
            userService.updateUser(user);
            return Result.success();
        }
        throw new RuntimeException("用户未登录");
    }
}