package com.ryan.myblog.config;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.exception.DistributedLockException;
import com.ryan.myblog.exception.RateLimitException;
import com.ryan.myblog.exception.ResourceNotFoundException;
import com.ryan.myblog.model.vo.ErrorLogVO;
import com.ryan.myblog.service.ErrorLogService;
import com.ryan.myblog.utils.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final ErrorLogService errorLogService;

    /**
     * 处理认证异常
     * 返回 401 Unauthorized
     */
    @ExceptionHandler(AuthenticationException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Result<Void> handleAuthenticationException(AuthenticationException e) {
        log.warn("认证失败: {}", e.getMessage());
        return Result.error(401, "认证失败，请重新登录");
    }

    /**
     * 处理限流异常
     * 返回 429 Too Many Requests
     */
    @ExceptionHandler(RateLimitException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public Result<Void> handleRateLimitException(RateLimitException e) {
        log.warn("请求限流: {}", e.getMessage());
        return Result.error(429, e.getMessage());
    }

    /**
     * 处理分布式锁异常
     * 返回 429 Too Many Requests（并发操作过于频繁）
     */
    @ExceptionHandler(DistributedLockException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public Result<Void> handleDistributedLockException(DistributedLockException e) {
        log.warn("分布式锁获取失败: {}", e.getMessage());
        return Result.error(429, e.getMessage());
    }

    /**
     * 处理资源不存在异常
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleResourceNotFoundException(ResourceNotFoundException e) {
        log.warn("资源不存在: {}", e.getMessage());
        return Result.error(HttpStatus.NOT_FOUND.value(), e.getMessage());
    }

    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        log.error("运行时异常: {}", e.getMessage(), e);
        logError(e, HttpStatus.BAD_REQUEST.value(), "RuntimeException");
        return Result.error(e.getMessage());
    }

    /**
     * 处理参数验证异常
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("参数异常: {}", e.getMessage(), e);
        logError(e, HttpStatus.BAD_REQUEST.value(), "IllegalArgumentException");
        return Result.error(e.getMessage());
    }

    /**
     * 处理资源未找到异常 (如 favicon.ico)
     */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNoResourceFoundException(
            org.springframework.web.servlet.resource.NoResourceFoundException e) {
        log.debug("资源未找到: {}", e.getMessage());
        return Result.error(404, "资源不存在");
    }

    /**
     * 处理通用异常
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);
        logError(e, HttpStatus.INTERNAL_SERVER_ERROR.value(), "Exception");
        return Result.error("系统错误，请稍后重试");
    }

    /**
     * 记录错误日志
     */
    private void logError(Exception e, int status, String errorType) {
        try {
            HttpServletRequest request = getCurrentRequest();
            if (request == null) {
                return;
            }

            // 构建错误日志
            ErrorLogVO.ErrorLogVOBuilder builder = ErrorLogVO.builder()
                    .timestamp(LocalDateTime.now())
                    .status(status)
                    .method(request.getMethod())
                    .uri(request.getRequestURI())
                    .errorType(errorType)
                    .message(e.getMessage())
                    .ip(IpUtils.getClientIp(request))
                    .userAgent(request.getHeader("User-Agent"));

            // 获取当前登录用户信息
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                try {
                    builder.userId((Long) authentication.getPrincipal());
                } catch (Exception ex) {
                    // 忽略用户信息获取失败
                }
            }

            // 获取堆栈跟踪（仅前10行）
            String stackTrace = getStackTrace(e, 10);
            builder.stackTrace(stackTrace);

            // 异步记录错误日志
            errorLogService.logError(builder.build());

        } catch (Exception ex) {
            log.error("记录错误日志失败", ex);
        }
    }

    /**
     * 获取当前请求
     */
    private HttpServletRequest getCurrentRequest() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            return attributes != null ? attributes.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 获取堆栈跟踪（限制行数）
     */
    private String getStackTrace(Exception e, int maxLines) {
        try {
            StringWriter sw = new StringWriter();
            PrintWriter pw = new PrintWriter(sw);
            e.printStackTrace(pw);
            String fullTrace = sw.toString();

            // 限制行数
            String[] lines = fullTrace.split("\n");
            if (lines.length <= maxLines) {
                return fullTrace;
            }

            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < maxLines; i++) {
                sb.append(lines[i]).append("\n");
            }
            sb.append("... (" + (lines.length - maxLines) + " more lines)");
            return sb.toString();

        } catch (Exception ex) {
            return "无法获取堆栈跟踪";
        }
    }
}
