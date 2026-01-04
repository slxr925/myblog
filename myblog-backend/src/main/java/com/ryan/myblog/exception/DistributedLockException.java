package com.ryan.myblog.exception;

/**
 * 分布式锁异常
 * 当获取分布式锁失败时抛出
 */
public class DistributedLockException extends RuntimeException {

    public DistributedLockException(String message) {
        super(message);
    }

    public DistributedLockException(String message, Throwable cause) {
        super(message, cause);
    }
}
