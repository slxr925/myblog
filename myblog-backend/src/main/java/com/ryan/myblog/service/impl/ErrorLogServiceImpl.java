package com.ryan.myblog.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.model.vo.ErrorLogVO;
import com.ryan.myblog.service.ErrorLogService;
import com.ryan.myblog.service.UnifiedCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * 错误日志服务实现（使用统一缓存管理）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ErrorLogServiceImpl implements ErrorLogService {

    private final UnifiedCacheService cacheService;
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private static final int MAX_ERROR_LOGS = 100; // 最多保留100条错误日志

    @Override
    public void logError(ErrorLogVO errorLog) {
        try {
            // 生成错误ID
            if (errorLog.getErrorId() == null) {
                errorLog.setErrorId(UUID.randomUUID().toString());
            }

            // 设置时间戳
            if (errorLog.getTimestamp() == null) {
                errorLog.setTimestamp(LocalDateTime.now());
            }

            // 序列化错误日志
            String errorJson = objectMapper.writeValueAsString(errorLog);

            // 使用统一缓存服务存储错误详情
            cacheService.set(RedisKeyFactory.ERROR_LOG_DETAIL, errorJson, errorLog.getErrorId());

            // 添加到索引（使用ZADD，以时间戳为分数）
            double score = System.currentTimeMillis();
            cacheService.addToZSet(RedisKeyFactory.ERROR_LOG_INDEX, errorLog.getErrorId(), score);

            // 保持索引大小，移除最老的记录
            Long size = cacheService.getZSetSize(RedisKeyFactory.ERROR_LOG_INDEX);
            if (size != null && size > MAX_ERROR_LOGS) {
                // 获取最老的错误ID并移除
                Set<String> oldestIds = cacheService.getZSetRange(
                        RedisKeyFactory.ERROR_LOG_INDEX,
                        0,
                        size - MAX_ERROR_LOGS - 1,
                        String.class);

                if (oldestIds != null && !oldestIds.isEmpty()) {
                    // 从ZSet中移除
                    cacheService.removeFromZSet(
                            RedisKeyFactory.ERROR_LOG_INDEX,
                            oldestIds.toArray());

                    // 删除对应的错误详情
                    for (String oldId : oldestIds) {
                        cacheService.delete(RedisKeyFactory.ERROR_LOG_DETAIL, oldId);
                    }
                }
            }

            log.debug("错误日志已记录: {} - {}", errorLog.getErrorId(), errorLog.getMessage());

        } catch (JsonProcessingException e) {
            log.error("序列化错误日志失败", e);
        } catch (Exception e) {
            log.error("记录错误日志失败", e);
        }
    }

    @Override
    public List<ErrorLogVO> getRecentErrors(int limit) {
        List<ErrorLogVO> errors = new ArrayList<>();

        try {
            // 从索引中获取最近的错误ID（按分数倒序，使用负索引）
            Set<String> errorIds = cacheService.getZSetRange(
                    RedisKeyFactory.ERROR_LOG_INDEX,
                    -limit,
                    -1,
                    String.class);

            if (errorIds != null && !errorIds.isEmpty()) {
                // 反转顺序（最新的在前）
                List<String> reversedIds = new ArrayList<>(errorIds);
                java.util.Collections.reverse(reversedIds);

                for (String errorId : reversedIds) {
                    String errorJson = cacheService.get(
                            RedisKeyFactory.ERROR_LOG_DETAIL,
                            String.class,
                            errorId);

                    if (errorJson != null) {
                        try {
                            ErrorLogVO errorLog = objectMapper.readValue(errorJson, ErrorLogVO.class);
                            errors.add(errorLog);
                        } catch (JsonProcessingException e) {
                            log.error("反序列化错误日志失败: {}", errorId, e);
                        }
                    } else {
                        // 错误详情已过期，从索引中移除
                        cacheService.removeFromZSet(
                                RedisKeyFactory.ERROR_LOG_INDEX,
                                new Object[] { errorId });
                    }
                }
            }

        } catch (Exception e) {
            log.error("获取最近错误日志失败", e);
        }

        return errors;
    }

    @Override
    public long getErrorCount24Hours() {
        try {
            // 因为所有错误都在24小时内，直接返回ZSet大小
            Long count = cacheService.getZSetSize(RedisKeyFactory.ERROR_LOG_INDEX);
            return count != null ? count : 0;

        } catch (Exception e) {
            log.error("获取24小时错误数量失败", e);
            return 0;
        }
    }

    @Override
    public void cleanupExpiredErrors() {
        try {
            // 计算24小时前的时间戳
            long timestamp24HoursAgo = System.currentTimeMillis() - (24 * 60 * 60 * 1000);

            // 获取过期的错误ID
            Set<String> expiredIds = cacheService.getZSetRange(
                    RedisKeyFactory.ERROR_LOG_INDEX,
                    0,
                    timestamp24HoursAgo,
                    String.class);

            if (expiredIds != null && !expiredIds.isEmpty()) {
                // 从ZSet中移除
                cacheService.removeFromZSet(
                        RedisKeyFactory.ERROR_LOG_INDEX,
                        expiredIds.toArray());

                // 删除对应的错误详情
                for (String errorId : expiredIds) {
                    cacheService.delete(RedisKeyFactory.ERROR_LOG_DETAIL, errorId);
                }

                log.info("清理过期错误日志: {} 条", expiredIds.size());
            }

        } catch (Exception e) {
            log.error("清理过期错误日志失败", e);
        }
    }
}
