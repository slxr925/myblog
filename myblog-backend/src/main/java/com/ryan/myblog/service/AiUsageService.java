package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.AiUsageDailyVO;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import com.ryan.myblog.model.vo.AiQuotaVO;

import java.util.List;

/**
 * AI使用统计服务
 */
public interface AiUsageService {

    AiQuotaReservation reserve(String requestId, Long userId, AiAction action, int estimatedTokens, boolean unlimited);

    void confirm(String requestId);

    boolean refund(String requestId);

    AiQuotaVO getQuota(Long userId, boolean unlimited);

    int refundStaleReservations();

    List<AiUsageDailyVO> getDailyUsage(Long userId, int days);

    List<AiUsageUserVO> getTopUsers(int days, int limit);
}
