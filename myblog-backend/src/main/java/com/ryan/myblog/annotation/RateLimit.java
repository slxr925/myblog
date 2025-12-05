package com.ryan.myblog.annotation;

import java.lang.annotation.*;

/**
 * 请求频率限制注解
 * 使用Redis实现滑动窗口限流
 * 
 * 使用示例：
 * @RateLimit(key = "ip", limit = 5, window = 300)  // 5分钟内最多5次
 * @RateLimit(key = "user", limit = 10, window = 60) // 1分钟内最多10次
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    
    /**
     * 限流维度
     * - "ip": 按IP地址限流
     * - "user": 按用户ID限流
     * - "ip_user": 按IP和用户组合限流
     */
    String key() default "ip";
    
    /**
     * 时间窗口内允许的最大请求次数
     */
    int limit() default 100;
    
    /**
     * 时间窗口大小（秒）
     */
    int window() default 60;
    
    /**
     * 限流描述（用于日志和错误提示）
     */
    String message() default "操作过于频繁，请稍后再试";
}

