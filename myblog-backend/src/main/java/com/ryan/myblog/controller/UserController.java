package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.dto.ChangePasswordDTO;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.service.SessionService;
import com.ryan.myblog.service.UserService;
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
     */
    @PostMapping("/register")
    public Result<Void> register(@Validated @RequestBody UserRegisterDTO userRegisterDTO) {
        userService.register(userRegisterDTO);
        log.info("用户注册成功：{}", userRegisterDTO.getUsername());
        return Result.success();
    }
    
    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<String> login(@Validated @RequestBody UserLoginDTO userLoginDTO) {
        log.info("用户登录请求：{}", userLoginDTO.getUsername());
        String token = userService.login(userLoginDTO);
        log.info("用户登录成功，返回token，长度：{}", token.length());
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