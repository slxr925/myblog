package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.AiUsageDailyMapper;
import com.ryan.myblog.model.entity.AiUsageDaily;
import com.ryan.myblog.model.vo.AiUsageDailyVO;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import com.ryan.myblog.service.AiUsageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageDailyMapper aiUsageDailyMapper;

    @Override
    @Transactional
    public boolean checkAndConsume(Long userId, int estimatedTokens, int maxRequestsPerDay, int maxTokensPerDay) {
        if (userId == null) {
            return true; // 匿名用户不计入配额
        }
        LocalDate today = LocalDate.now();
        AiUsageDaily usage = getOrCreate(userId, today);

        int nextRequestCount = usage.getRequestCount() + 1;
        int nextTokenCount = usage.getTokenCount() + Math.max(estimatedTokens, 1);
        if (maxRequestsPerDay > 0 && nextRequestCount > maxRequestsPerDay) {
            return false;
        }
        if (maxTokensPerDay > 0 && nextTokenCount > maxTokensPerDay) {
            return false;
        }

        usage.setRequestCount(nextRequestCount);
        usage.setTokenCount(nextTokenCount);
        aiUsageDailyMapper.updateById(usage);
        return true;
    }

    @Override
    @Transactional
    public void recordUsage(Long userId, int estimatedTokens) {
        if (userId == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        AiUsageDaily usage = getOrCreate(userId, today);
        usage.setRequestCount(usage.getRequestCount() + 1);
        usage.setTokenCount(usage.getTokenCount() + Math.max(estimatedTokens, 1));
        aiUsageDailyMapper.updateById(usage);
    }

    @Override
    public List<AiUsageDailyVO> getDailyUsage(Long userId, int days) {
        LambdaQueryWrapper<AiUsageDaily> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiUsageDaily::getUserId, userId)
                .ge(AiUsageDaily::getUsageDate, LocalDate.now().minusDays(days))
                .orderByDesc(AiUsageDaily::getUsageDate);
        return aiUsageDailyMapper.selectList(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public List<AiUsageUserVO> getTopUsers(int days, int limit) {
        return aiUsageDailyMapper.selectTopUsers(days, limit);
    }

    private AiUsageDaily getOrCreate(Long userId, LocalDate date) {
        LambdaQueryWrapper<AiUsageDaily> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(AiUsageDaily::getUserId, userId).eq(AiUsageDaily::getUsageDate, date);
        AiUsageDaily usage = aiUsageDailyMapper.selectOne(wrapper);
        if (usage == null) {
            usage = new AiUsageDaily();
            usage.setUserId(userId);
            usage.setUsageDate(date);
            usage.setRequestCount(0);
            usage.setTokenCount(0);
            aiUsageDailyMapper.insert(usage);
        }
        return usage;
    }

    private AiUsageDailyVO toVO(AiUsageDaily usage) {
        AiUsageDailyVO vo = new AiUsageDailyVO();
        vo.setDate(usage.getUsageDate());
        vo.setRequestCount(usage.getRequestCount());
        vo.setTokenCount(usage.getTokenCount());
        return vo;
    }
}
