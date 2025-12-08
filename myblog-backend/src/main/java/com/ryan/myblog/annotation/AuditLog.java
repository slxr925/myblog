package com.ryan.myblog.annotation;

import java.lang.annotation.*;

/**
 * 审计日志注解
 * 用于标记需要记录审计日志的方法
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditLog {
    
    /**
     * 操作类型（如：CREATE, UPDATE, DELETE等）
     */
    String action();
    
    /**
     * 资源类型（如：BLOG, USER, CATEGORY等）
     */
    String resource();
}




