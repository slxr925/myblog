package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.AiUsageDailyVO;
import com.ryan.myblog.model.vo.AiUsageUserVO;

import java.util.List;

/**
 * AI使用统计服务
 */
public interface AiUsageService {

    boolean checkAndConsume(Long userId, int estimatedTokens, int maxRequestsPerDay, int maxTokensPerDay);

    void recordUsage(Long userId, int estimatedTokens);

    List<AiUsageDailyVO> getDailyUsage(Long userId, int days);

    List<AiUsageUserVO> getTopUsers(int days, int limit);
}
