package com.ryan.myblog.aspect;

import com.ryan.myblog.annotation.DistributedLock;
import com.ryan.myblog.exception.DistributedLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.Expression;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 分布式锁切面
 * 
 * 实现原理：
 * 1. 使用Redis的SET NX EX命令实现加锁
 * 2. 使用Lua脚本实现原子性解锁（验证value后删除）
 * 3. 支持SpEL表达式动态生成锁的key
 * 4. 支持等待获取锁（自旋重试）
 * 
 * 面试要点：
 * 1. 为什么value用UUID？
 * - 唯一标识当前线程持有的锁
 * - 释放锁时验证value，防止误删其他线程的锁
 * 
 * 2. 为什么用Lua脚本释放锁？
 * - 验证value和删除key必须是原子操作
 * - 否则可能验证通过后，锁过期被其他线程获取，再删除就误删了
 * 
 * 3. 锁过期时间如何设置？
 * - 应大于业务执行时间的最大值
 * - 如果业务时间不确定，考虑使用看门狗机制自动续期
 * 
 * 4. 获取锁失败怎么处理？
 * - 立即失败：适用于防重提交场景
 * - 等待重试：适用于资源竞争场景
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class DistributedLockAspect {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String LOCK_KEY_PREFIX = "myblog:lock:";

    private static final SpelExpressionParser PARSER = new SpelExpressionParser();
    private static final DefaultParameterNameDiscoverer NAME_DISCOVERER = new DefaultParameterNameDiscoverer();

    /**
     * Lua脚本：原子性释放锁
     * 只有当key存在且value匹配时才删除
     */
    private static final String UNLOCK_SCRIPT = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";

    @Around("@annotation(distributedLock)")
    public Object around(ProceedingJoinPoint point, DistributedLock distributedLock) throws Throwable {
        // 1. 解析锁的key
        String lockKey = buildLockKey(point, distributedLock);

        // 2. 生成唯一的value（用于释放锁时验证）
        String lockValue = UUID.randomUUID().toString();

        // 3. 尝试获取锁
        boolean locked = tryLock(lockKey, lockValue, distributedLock.expire(), distributedLock.waitTime());

        if (!locked) {
            log.warn("获取分布式锁失败 - key: {}, method: {}",
                    lockKey, getMethodName(point));

            if (distributedLock.throwOnFail()) {
                throw new DistributedLockException(distributedLock.message());
            } else {
                return null;
            }
        }

        try {
            log.debug("获取分布式锁成功 - key: {}, method: {}", lockKey, getMethodName(point));

            // 4. 执行业务逻辑
            return point.proceed();

        } finally {
            // 5. 释放锁
            unlock(lockKey, lockValue);
        }
    }

    /**
     * 构建锁的key
     * 使用SpEL解析动态key
     */
    private String buildLockKey(ProceedingJoinPoint point, DistributedLock distributedLock) {
        String keyExpression = distributedLock.key();
        String prefix = distributedLock.prefix();

        // 解析SpEL表达式
        String parsedKey = parseSpEL(keyExpression, point);

        return LOCK_KEY_PREFIX + prefix + parsedKey;
    }

    /**
     * 解析SpEL表达式
     */
    private String parseSpEL(String expression, ProceedingJoinPoint point) {
        try {
            MethodSignature signature = (MethodSignature) point.getSignature();
            Method method = signature.getMethod();
            Object[] args = point.getArgs();

            // 获取参数名
            String[] parameterNames = NAME_DISCOVERER.getParameterNames(method);
            if (parameterNames == null || parameterNames.length == 0) {
                return expression;
            }

            // 构建SpEL上下文
            EvaluationContext context = new StandardEvaluationContext();
            for (int i = 0; i < parameterNames.length; i++) {
                context.setVariable(parameterNames[i], args[i]);
            }

            // 解析表达式
            Expression exp = PARSER.parseExpression(expression);
            Object value = exp.getValue(context);

            return value != null ? value.toString() : expression;

        } catch (Exception e) {
            log.warn("SpEL解析失败，使用原始表达式: expression={}, error={}",
                    expression, e.getMessage());
            return expression;
        }
    }

    /**
     * 尝试获取锁
     * 
     * @param key           锁的key
     * @param value         锁的value（唯一标识）
     * @param expireSeconds 过期时间（秒）
     * @param waitSeconds   等待时间（秒），0表示不等待
     * @return 是否获取成功
     */
    private boolean tryLock(String key, String value, long expireSeconds, long waitSeconds) {
        long startTime = System.currentTimeMillis();
        long waitMillis = waitSeconds * 1000;

        do {
            // 尝试加锁：SET key value NX EX seconds
            Boolean success = stringRedisTemplate.opsForValue()
                    .setIfAbsent(key, value, expireSeconds, TimeUnit.SECONDS);

            if (Boolean.TRUE.equals(success)) {
                return true;
            }

            // 如果不等待，直接返回失败
            if (waitSeconds <= 0) {
                return false;
            }

            // 等待一段时间后重试
            try {
                Thread.sleep(50); // 50ms重试间隔
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }

        } while (System.currentTimeMillis() - startTime < waitMillis);

        return false;
    }

    /**
     * 释放锁
     * 使用Lua脚本保证原子性：只有value匹配时才删除
     */
    private void unlock(String key, String value) {
        try {
            DefaultRedisScript<Long> script = new DefaultRedisScript<>();
            script.setScriptText(UNLOCK_SCRIPT);
            script.setResultType(Long.class);

            Long result = stringRedisTemplate.execute(script, Collections.singletonList(key), value);

            if (result != null && result == 1) {
                log.debug("分布式锁释放成功 - key: {}", key);
            } else {
                log.warn("分布式锁释放失败（锁已过期或已被释放）- key: {}", key);
            }

        } catch (Exception e) {
            log.error("分布式锁释放异常 - key: {}, error: {}", key, e.getMessage(), e);
        }
    }

    /**
     * 获取方法名（用于日志）
     */
    private String getMethodName(ProceedingJoinPoint point) {
        MethodSignature signature = (MethodSignature) point.getSignature();
        return signature.getDeclaringType().getSimpleName() + "." + signature.getName();
    }
}
