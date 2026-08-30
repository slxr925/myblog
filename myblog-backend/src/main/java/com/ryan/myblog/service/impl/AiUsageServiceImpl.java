package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.exception.AiQuotaExceededException;
import com.ryan.myblog.exception.DuplicateAiRequestException;
import com.ryan.myblog.mapper.AiQuotaUsageMapper;
import com.ryan.myblog.mapper.AiUsageDailyMapper;
import com.ryan.myblog.model.entity.AiQuotaUsage;
import com.ryan.myblog.model.entity.AiUsageDaily;
import com.ryan.myblog.model.vo.AiQuotaVO;
import com.ryan.myblog.model.vo.AiUsageDailyVO;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import com.ryan.myblog.service.AiAction;
import com.ryan.myblog.service.AiQuotaReservation;
import com.ryan.myblog.service.AiUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private static final ZoneId QUOTA_ZONE = ZoneId.of("Asia/Shanghai");
    private static final int STALE_RESERVATION_MINUTES = 5;
    private static final int STALE_BATCH_SIZE = 200;

    private final AiUsageDailyMapper aiUsageDailyMapper;
    private final AiQuotaUsageMapper aiQuotaUsageMapper;

    @Value("${app.ai.quota.max-requests-per-day:3}")
    private int maxRequestsPerDay;

    @Value("${app.ai.quota.max-tokens-per-day:50000}")
    private int maxTokensPerDay;

    @Override
    @Transactional
    public AiQuotaReservation reserve(String requestId, Long userId, AiAction action,
                                      int estimatedTokens, boolean unlimited) {
        if (userId == null) {
            throw new InsufficientAuthenticationException("请先登录后使用 AI 功能");
        }

        String effectiveRequestId = requestId == null || requestId.isBlank()
                ? UUID.randomUUID().toString()
                : requestId.trim();
        if (effectiveRequestId.length() > 64) {
            throw new IllegalArgumentException("AI 请求 ID 长度不能超过 64 个字符");
        }

        LocalDate today = LocalDate.now(QUOTA_ZONE);
        int safeTokens = Math.max(estimatedTokens, 1);
        if (aiQuotaUsageMapper.insertReservation(
                effectiveRequestId, userId, today, action.name(), safeTokens) == 0) {
            throw new DuplicateAiRequestException();
        }

        aiUsageDailyMapper.insertIfAbsent(userId, today);
        int consumed = unlimited
                ? aiUsageDailyMapper.consumeUnlimited(userId, today, safeTokens)
                : aiUsageDailyMapper.consumeWithinLimit(
                        userId, today, safeTokens, maxRequestsPerDay, maxTokensPerDay);
        if (consumed != 1) {
            throw new AiQuotaExceededException();
        }

        return new AiQuotaReservation(effectiveRequestId, userId, today, action, safeTokens, unlimited);
    }

    @Override
    @Transactional
    public void confirm(String requestId) {
        aiQuotaUsageMapper.transitionReserved(requestId, "CONSUMED");
    }

    @Override
    @Transactional
    public boolean refund(String requestId) {
        AiQuotaUsage usage = aiQuotaUsageMapper.selectByRequestId(requestId);
        if (usage == null || aiQuotaUsageMapper.transitionReserved(requestId, "REFUNDED") != 1) {
            return false;
        }
        aiUsageDailyMapper.refund(usage.getUserId(), usage.getUsageDate(), usage.getEstimatedTokens());
        return true;
    }

    @Override
    public AiQuotaVO getQuota(Long userId, boolean unlimited) {
        if (userId == null) {
            throw new InsufficientAuthenticationException("请先登录后使用 AI 功能");
        }
        LocalDate today = LocalDate.now(QUOTA_ZONE);
        Integer count = aiUsageDailyMapper.selectRequestCount(userId, today);
        int used = count == null ? 0 : count;
        Integer limit = unlimited ? null : maxRequestsPerDay;
        Integer remaining = unlimited ? null : Math.max(maxRequestsPerDay - used, 0);
        OffsetDateTime resetAt = today.plusDays(1).atStartOfDay(QUOTA_ZONE).toOffsetDateTime();
        return AiQuotaVO.builder()
                .date(today)
                .limit(limit)
                .used(used)
                .remaining(remaining)
                .available(unlimited || maxRequestsPerDay <= 0 || remaining > 0)
                .unlimited(unlimited)
                .resetAt(resetAt)
                .build();
    }

    @Override
    @Transactional
    public int refundStaleReservations() {
        LocalDateTime cutoff = LocalDateTime.now(QUOTA_ZONE).minusMinutes(STALE_RESERVATION_MINUTES);
        List<AiQuotaUsage> stale = aiQuotaUsageMapper.selectStaleReservations(cutoff, STALE_BATCH_SIZE);
        int refunded = 0;
        for (AiQuotaUsage usage : stale) {
            if (refund(usage.getRequestId())) {
                refunded++;
            }
        }
        return refunded;
    }

    @Override
    public List<AiUsageDailyVO> getDailyUsage(Long userId, int days) {
        LambdaQueryWrapper<AiUsageDaily> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiUsageDaily::getUserId, userId)
                .ge(AiUsageDaily::getUsageDate, LocalDate.now(QUOTA_ZONE).minusDays(days))
                .orderByDesc(AiUsageDaily::getUsageDate);
        return aiUsageDailyMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<AiUsageUserVO> getTopUsers(int days, int limit) {
        return aiUsageDailyMapper.selectTopUsers(days, limit);
    }

    private AiUsageDailyVO toVO(AiUsageDaily usage) {
        AiUsageDailyVO vo = new AiUsageDailyVO();
        vo.setDate(usage.getUsageDate());
        vo.setRequestCount(usage.getRequestCount());
        vo.setTokenCount(usage.getTokenCount());
        return vo;
    }
}
