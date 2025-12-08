package com.ryan.myblog.exception;

import com.ryan.myblog.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Spring Security 异常处理器
 * 统一处理认证和授权相关的异常，返回标准的JSON格式
 */
@Slf4j
@RestControllerAdvice
public class SecurityExceptionHandler {
    
    /**
     * 处理认证异常（未登录）
     * 返回 401 Unauthorized
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<Void> handleAuthenticationException(
            AuthenticationException e,
            HttpServletRequest request) {
        
        log.warn("认证失败 - URI: {}, 错误: {}", request.getRequestURI(), e.getMessage());
        return Result.error(HttpStatus.UNAUTHORIZED.value(), "未授权，请先登录");
    }
    
    /**
     * 处理授权异常（无权限）
     * 返回 403 Forbidden
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Result<Void> handleAccessDeniedException(
            AccessDeniedException e,
            HttpServletRequest request) {
        
        log.warn("授权失败 - URI: {}, 用户: {}, 错误: {}", 
                request.getRequestURI(), 
                request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "匿名",
                e.getMessage());
        
        return Result.error(HttpStatus.FORBIDDEN.value(), "权限不足，无法访问");
    }
}




