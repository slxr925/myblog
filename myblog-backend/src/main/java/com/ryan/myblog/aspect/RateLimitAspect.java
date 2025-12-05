package com.ryan.myblog.aspect;

import com.ryan.myblog.annotation.RateLimit;
import com.ryan.myblog.exception.RateLimitException;
import com.ryan.myblog.utils.IpUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;

/**
 * 请求频率限制切面
 * 使用Redis ZSET实现滑动窗口限流算法
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    private static final String RATE_LIMIT_KEY_PREFIX = "rate_limit:";
    
    @Around("@annotation(com.ryan.myblog.annotation.RateLimit)")
    public Object around(ProceedingJoinPoint point) throws Throwable {
        // 获取方法签名
        MethodSignature signature = (MethodSignature) point.getSignature();
        Method method = signature.getMethod();
        RateLimit rateLimit = method.getAnnotation(RateLimit.class);
        
        // 构建限流key
        String rateLimitKey = buildRateLimitKey(rateLimit.key());
        
        // 检查是否超过限流
        boolean allowed = checkRateLimit(
            rateLimitKey,
            rateLimit.limit(),
            rateLimit.window()
        );
        
        if (!allowed) {
            String methodName = method.getDeclaringClass().getSimpleName() + "." + method.getName();
            log.warn("请求被限流 - 方法: {}, key: {}, 限制: {}/{}秒", 
                    methodName, rateLimitKey, rateLimit.limit(), rateLimit.window());
            throw new RateLimitException(rateLimit.message());
        }
        
        // 执行原方法
        return point.proceed();
    }
    
    /**
     * 构建限流key
     */
    private String buildRateLimitKey(String keyType) {
        ServletRequestAttributes attributes = 
            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        
        if (attributes == null) {
            log.warn("无法获取请求上下文，使用默认key");
            return RATE_LIMIT_KEY_PREFIX + "unknown";
        }
        
        HttpServletRequest request = attributes.getRequest();
        StringBuilder keyBuilder = new StringBuilder(RATE_LIMIT_KEY_PREFIX);
        
        switch (keyType.toLowerCase()) {
            case "ip":
                // 按IP限流
                String ip = IpUtils.getClientIp(request);
                keyBuilder.append("ip:").append(ip);
                break;
                
            case "user":
                // 按用户限流
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.getPrincipal() instanceof Long userId) {
                    keyBuilder.append("user:").append(userId);
                } else {
                    // 未登录用户使用IP
                    String userIp = IpUtils.getClientIp(request);
                    keyBuilder.append("user:anonymous:").append(userIp);
                }
                break;
                
            case "ip_user":
                // IP和用户组合
                String ipAddr = IpUtils.getClientIp(request);
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication != null && authentication.getPrincipal() instanceof Long uId) {
                    keyBuilder.append("ip_user:").append(ipAddr).append(":").append(uId);
                } else {
                    keyBuilder.append("ip_user:").append(ipAddr).append(":anonymous");
                }
                break;
                
            default:
                log.warn("未知的限流key类型: {}, 使用IP", keyType);
                String defaultIp = IpUtils.getClientIp(request);
                keyBuilder.append("ip:").append(defaultIp);
        }
        
        // 添加接口路径到key中，避免不同接口共享限流计数
        String uri = request.getRequestURI();
        keyBuilder.append(":").append(uri.replaceAll("/", "_"));
        
        return keyBuilder.toString();
    }
    
    /**
     * 检查是否超过限流
     * 使用滑动窗口算法
     */
    private boolean checkRateLimit(String key, int limit, int windowSeconds) {
        long now = System.currentTimeMillis();
        long windowStart = now - (windowSeconds * 1000L);
        
        try {
            // 1. 移除时间窗口之外的旧记录
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
            
            // 2. 统计当前窗口内的请求次数
            Long count = redisTemplate.opsForZSet().zCard(key);
            
            if (count != null && count >= limit) {
                // 超过限制
                return false;
            }
            
            // 3. 添加当前请求到ZSet
            redisTemplate.opsForZSet().add(key, String.valueOf(now), now);
            
            // 4. 设置key过期时间（窗口大小的2倍，确保旧数据被清理）
            redisTemplate.expire(key, windowSeconds * 2L, TimeUnit.SECONDS);
            
            return true;
            
        } catch (Exception e) {
            log.error("限流检查失败: {}", e.getMessage(), e);
            // 如果Redis出错，为了不影响正常业务，允许请求通过
            return true;
        }
    }
}

