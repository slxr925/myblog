package com.ryan.myblog.exception;

/**
 * 限流异常
 * 当请求超过频率限制时抛出
 */
public class RateLimitException extends RuntimeException {
    
    public RateLimitException(String message) {
        super(message);
    }
    
    public RateLimitException(String message, Throwable cause) {
        super(message, cause);
    }
}



