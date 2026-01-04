package com.ryan.myblog.annotation;

import java.lang.annotation.*;

/**
 * 全局接口限流注解
 * 应用于Controller类，对该类下所有方法生效
 * 
 * 使用示例：
 * 
 * <pre>
 * &#64;GlobalRateLimit(limit = 100, window = 60)  // 每分钟最多100次
 * @RestController
 * &#64;RequestMapping("/api/blogs")
 * public class BlogController { ... }
 * </pre>
 * 
 * 优先级说明：
 * 1. 方法级 @RateLimit 注解优先级最高
 * 2. 类级 @GlobalRateLimit 次之
 * 3. 如果都没有，使用默认全局限流配置
 * 
 * 面试要点：
 * 1. 为什么需要全局限流？
 * - 防止恶意攻击（CC攻击、爬虫）
 * - 保护后端服务，避免资源耗尽
 * - 保证服务稳定性和可用性
 * 
 * 2. 限流算法选择？
 * - 固定窗口：简单但有边界问题
 * - 滑动窗口：更平滑，推荐使用
 * - 令牌桶：适合允许突发流量
 * - 漏桶：严格平滑，延迟可控
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface GlobalRateLimit {

    /**
     * 时间窗口内允许的最大请求次数
     * 默认每分钟100次
     */
    int limit() default 100;

    /**
     * 时间窗口大小（秒）
     * 默认60秒
     */
    int window() default 60;

    /**
     * 限流维度
     * - "ip": 按IP地址限流（默认）
     * - "user": 按用户ID限流
     * - "ip_user": 按IP和用户组合限流
     */
    String key() default "ip";

    /**
     * 限流提示消息
     */
    String message() default "请求过于频繁，请稍后再试";

    /**
     * 是否启用
     * 可以通过配置动态关闭
     */
    boolean enabled() default true;
}
