package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.config.JwtProperties;
import com.ryan.myblog.model.dto.TokenResponse;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.service.SessionService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.IpUtils;
import com.ryan.myblog.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 处理token刷新等认证相关操作
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final SessionService sessionService;
    private final JwtProperties jwtProperties;
    
    /**
     * 刷新Access Token
     * 使用Refresh Token获取新的Access Token
     */
    @PostMapping("/refresh")
    public Result<TokenResponse> refreshToken(
            @RequestHeader("Authorization") String authorization,
            HttpServletRequest request) {
        
        log.info("收到Token刷新请求");
        
        // 提取refresh token
        if (StringUtils.isBlank(authorization) || !authorization.startsWith("Bearer ")) {
            return Result.error(401, "无效的Authorization header");
        }
        
        String refreshToken = authorization.substring(7);
        
        // 验证refresh token
        if (!jwtUtils.validateToken(refreshToken)) {
            log.warn("Refresh Token验证失败");
            return Result.error(401, "Refresh Token已过期或无效");
        }
        
        // 检查token类型
        String tokenType = jwtUtils.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            log.warn("Token类型错误，期望refresh，实际: {}", tokenType);
            return Result.error(401, "Token类型错误");
        }
        
        try {
            // 从refresh token中获取用户ID
            Long userId = jwtUtils.getUserIdFromToken(refreshToken);
            
            // 查询用户信息
            User user = userService.getUserById(userId);
            if (user == null) {
                log.warn("用户不存在：{}", userId);
                return Result.error(401, "用户不存在");
            }
            
            // 检查用户状态
            if (user.getStatus() == 1) {
                log.warn("用户已被禁用：{}", userId);
                return Result.error(403, "用户已被禁用");
            }
            
            // 获取客户端IP
            String clientIp = IpUtils.getClientIp(request);
            
            // 生成新的Access Token
            String newAccessToken = jwtUtils.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                clientIp
            );
            
            // 保存会话
            sessionService.saveSession(newAccessToken, user.getId());
            
            log.info("Token刷新成功 - 用户：{}，IP：{}", user.getUsername(), clientIp);
            
            // 返回新的token（refresh token不变）
            TokenResponse tokenResponse = new TokenResponse(
                newAccessToken,
                refreshToken,
                jwtProperties.getAccessTokenExpiration()
            );
            
            return Result.success(tokenResponse);
            
        } catch (Exception e) {
            log.error("Token刷新失败", e);
            return Result.error(500, "Token刷新失败：" + e.getMessage());
        }
    }
    
    /**
     * 验证Token是否有效
     */
    @GetMapping("/validate")
    public Result<Boolean> validateToken(@RequestHeader("Authorization") String authorization) {
        if (StringUtils.isBlank(authorization) || !authorization.startsWith("Bearer ")) {
            return Result.success(false);
        }
        
        String token = authorization.substring(7);
        boolean isValid = jwtUtils.validateToken(token);
        
        return Result.success(isValid);
    }
}



