package com.ryan.myblog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 用户会话服务
 * 用于存储用户登录状态，解决刷新后需要重新登录的问题
 * 
 * 新增功能：
 * - 单设备登录：同一用户只能保持一个有效登录状态
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SessionService {

    private final RedisTemplate<String, Object> redisTemplate;

    // 会话过期时间：30天
    private static final long SESSION_EXPIRE_DAYS = 30;

    // Redis键前缀
    private static final String SESSION_PREFIX = "session:";
    private static final String USER_LATEST_TOKEN_PREFIX = "user:latest_token:";

    /**
     * 保存用户会话
     */
    public void saveSession(String token, Long userId) {
        String key = SESSION_PREFIX + token;
        try {
            redisTemplate.opsForValue().set(
                    key,
                    userId,
                    SESSION_EXPIRE_DAYS,
                    TimeUnit.DAYS);
            log.info("用户会话保存成功 - 用户ID: {}, 过期时间: {}天", userId, SESSION_EXPIRE_DAYS);
        } catch (Exception e) {
            log.error("保存用户会话失败 - 用户ID: {}", userId, e);
        }
    }

    /**
     * 保存用户会话（单设备登录模式）
     * 新登录会使旧token失效
     * 
     * @param newToken 新生成的token
     * @param userId   用户ID
     */
    public void saveSessionWithSingleDevice(String newToken, Long userId) {
        try {
            // 1. 获取并删除用户的旧token会话
            invalidateOldTokens(userId);

            // 2. 保存新token的会话
            String sessionKey = SESSION_PREFIX + newToken;
            redisTemplate.opsForValue().set(
                    sessionKey,
                    userId,
                    SESSION_EXPIRE_DAYS,
                    TimeUnit.DAYS);

            // 3. 记录用户最新的token（用于下次登录时查找）
            String latestTokenKey = USER_LATEST_TOKEN_PREFIX + userId;
            redisTemplate.opsForValue().set(
                    latestTokenKey,
                    newToken,
                    SESSION_EXPIRE_DAYS,
                    TimeUnit.DAYS);

            log.info("单设备登录-用户会话保存成功 - 用户ID: {}, 旧token已失效", userId);
        } catch (Exception e) {
            log.error("单设备登录-保存用户会话失败 - 用户ID: {}", userId, e);
            // 降级：即使失败也保存基本会话，不影响登录
            saveSession(newToken, userId);
        }
    }

    /**
     * 使用户的旧token失效
     * 
     * @param userId 用户ID
     */
    private void invalidateOldTokens(Long userId) {
        try {
            String latestTokenKey = USER_LATEST_TOKEN_PREFIX + userId;
            String oldToken = (String) redisTemplate.opsForValue().get(latestTokenKey);

            if (oldToken != null) {
                // 删除旧token的session
                String oldSessionKey = SESSION_PREFIX + oldToken;
                redisTemplate.delete(oldSessionKey);
                log.info("单设备登录-已删除旧token会话 - 用户ID: {}", userId);
            }
        } catch (Exception e) {
            log.warn("单设备登录-删除旧token失败 - 用户ID: {}", userId, e);
            // 不抛出异常，允许继续登录流程
        }
    }

    /**
     * 获取用户ID
     */
    public Long getUserIdByToken(String token) {
        String key = SESSION_PREFIX + token;
        try {
            Object userId = redisTemplate.opsForValue().get(key);
            if (userId instanceof Long) {
                return (Long) userId;
            } else if (userId instanceof Integer) {
                return ((Integer) userId).longValue();
            }
            return null;
        } catch (Exception e) {
            log.error("获取用户会话失败 - token: {}", token, e);
            return null;
        }
    }

    /**
     * 删除用户会话
     */
    public void deleteSession(String token) {
        String key = SESSION_PREFIX + token;
        try {
            redisTemplate.delete(key);
            log.info("用户会话删除成功 - token: {}", token);
        } catch (Exception e) {
            log.error("删除用户会话失败 - token: {}", token, e);
        }
    }

    /**
     * 刷新会话过期时间
     */
    public void refreshSession(String token) {
        String key = SESSION_PREFIX + token;
        try {
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) {
                redisTemplate.expire(key, SESSION_EXPIRE_DAYS, TimeUnit.DAYS);
                log.debug("用户会话刷新成功 - token: {}", token);
            }
        } catch (Exception e) {
            log.error("刷新用户会话失败 - token: {}", token, e);
        }
    }

    /**
     * 检查会话是否存在
     */
    public boolean isSessionValid(String token) {
        String key = SESSION_PREFIX + token;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("检查用户会话失败 - token: {}", token, e);
            return false;
        }
    }
}