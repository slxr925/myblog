package com.ryan.myblog.annotation;

import java.lang.annotation.*;

/**
 * 分布式锁注解
 * 使用Redis实现分布式锁，防止并发操作导致的数据不一致
 * 
 * 使用示例：
 * 
 * <pre>
 * // 按用户和博客ID加锁，防止重复点赞
 * &#64;DistributedLock(key = "'like:' + #blogId + ':' + #userId")
 * public Boolean toggleLike(Long blogId, Long userId) { ... }
 * 
 * // 按用户ID加锁，防止重复关注
 * @DistributedLock(key = "'follow:' + #followerId + ':' + #followeeId", expire = 10)
 * public Boolean toggleFollow(Long followerId, Long followeeId) { ... }
 * </pre>
 * 
 * 面试要点：
 * 1. 为什么用分布式锁？
 * - 单机锁（synchronized）在分布式环境下失效
 * - Redis锁可以跨JVM进程，保证集群环境下的原子性
 * 
 * 2. 实现原理：
 * - 使用 SET key value NX EX seconds 命令
 * - NX：只在key不存在时设置
 * - EX：设置过期时间，防止死锁
 * 
 * 3. 如何解决误删问题？
 * - value使用UUID唯一标识，释放锁时验证value
 * - 使用Lua脚本保证验证和删除的原子性
 * 
 * 4. 如何解决锁续期问题？
 * - 可以使用看门狗机制（Redisson实现）
 * - 本项目业务操作时间短，设置合理过期时间即可
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DistributedLock {

    /**
     * 锁的key表达式，支持SpEL
     * 例如：
     * - "'like:' + #blogId + ':' + #userId"
     * - "'user:' + #user.id"
     */
    String key();

    /**
     * 锁前缀（可选）
     * 最终key = prefix + 解析后的key
     */
    String prefix() default "lock:";

    /**
     * 锁过期时间（秒）
     * 防止死锁，业务应在此时间内完成
     */
    long expire() default 30;

    /**
     * 等待获取锁的超时时间（秒）
     * 0表示不等待，获取不到立即失败
     */
    long waitTime() default 3;

    /**
     * 获取锁失败时的提示消息
     */
    String message() default "操作过于频繁，请稍后再试";

    /**
     * 获取锁失败时是否抛出异常
     * false时返回null（适用于幂等操作）
     */
    boolean throwOnFail() default true;
}
