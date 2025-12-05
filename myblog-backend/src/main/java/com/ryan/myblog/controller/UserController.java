package com.ryan.myblog.controller;

import com.ryan.myblog.annotation.RateLimit;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.ChangePasswordDTO;
import com.ryan.myblog.model.dto.TokenResponse;
import com.ryan.myblog.model.dto.UserLoginDTO;
import com.ryan.myblog.model.dto.UserRegisterDTO;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.service.SessionService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.IpUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    
    private final UserService userService;
    private final SessionService sessionService;
    
    /**
     * 用户注册
     * 限流：每小时3次（防止恶意注册）
     */
    @PostMapping("/register")
    @RateLimit(key = "ip", limit = 3, window = 3600, message = "注册过于频繁，请1小时后再试")
    public Result<Void> register(@Validated @RequestBody UserRegisterDTO userRegisterDTO) {
        userService.register(userRegisterDTO);
        log.info("用户注册成功：{}", userRegisterDTO.getUsername());
        return Result.success();
    }
    
    /**
     * 用户登录
     * 返回access token和refresh token
     * 限流：5分钟5次（防止暴力破解）
     */
    @PostMapping("/login")
    @RateLimit(key = "ip", limit = 5, window = 300, message = "登录尝试次数过多，请5分钟后再试")
    public Result<TokenResponse> login(
            @Validated @RequestBody UserLoginDTO userLoginDTO,
            HttpServletRequest request) {
        log.info("用户登录请求：{}", userLoginDTO.getUsername());
        
        // 获取客户端IP
        String clientIp = IpUtils.getClientIp(request);
        
        // 使用双Token机制登录
        TokenResponse tokenResponse = userService.loginWithTokens(userLoginDTO, clientIp);
        
        log.info("用户登录成功，返回tokens");
        return Result.success(tokenResponse);
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
    public Result<Void> updateUserInfo(@RequestBody User updateUser) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            // 先获取当前用户信息
            User currentUser = userService.getUserById(userId);
            
            // 只更新允许修改的字段
            if (updateUser.getNickname() != null) {
                currentUser.setNickname(updateUser.getNickname());
            }
            if (updateUser.getEmail() != null) {
                currentUser.setEmail(updateUser.getEmail());
            }
            if (updateUser.getBio() != null) {
                currentUser.setBio(updateUser.getBio());
            }
            if (updateUser.getAvatar() != null) {
                currentUser.setAvatar(updateUser.getAvatar());
            }
            
            userService.updateUser(currentUser);
            return Result.success();
        }
        throw new RuntimeException("用户未登录");
    }
    
    /**
     * 修改密码
     */
    @PostMapping("/change-password")
    public Result<Void> changePassword(@Validated @RequestBody ChangePasswordDTO changePasswordDTO) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            // 验证新密码和确认密码是否一致
            if (!changePasswordDTO.getNewPassword().equals(changePasswordDTO.getConfirmPassword())) {
                throw new RuntimeException("新密码和确认密码不一致");
            }
            if (changePasswordDTO.getNewPassword().equals(changePasswordDTO.getCurrentPassword())) {
                throw new RuntimeException("新密码不能与原密码相同");
            }
            userService.changePassword(userId, changePasswordDTO.getCurrentPassword(), changePasswordDTO.getNewPassword());
            return Result.success();
        }
        throw new RuntimeException("用户未登录");
    }
    
    /**
     * 用户登出
     */
    @PostMapping("/logout")
    public Result<Void> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            // 从请求头获取token
            String token = getTokenFromRequest();
            if (token != null) {
                // 删除Redis中的会话
                sessionService.deleteSession(token);
            }
            return Result.success();
        }
        throw new RuntimeException("用户未登录");
    }
    
    /**
     * 从请求头中获取token
     */
    private String getTokenFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String bearerToken = request.getHeader("Authorization");
            if (org.apache.commons.lang3.StringUtils.isNotBlank(bearerToken) && bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7);
            }
        }
        return null;
    }
}