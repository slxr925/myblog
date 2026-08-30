package com.ryan.myblog.service.impl;

import com.ryan.myblog.exception.AiQuotaExceededException;
import com.ryan.myblog.exception.DuplicateAiRequestException;
import com.ryan.myblog.mapper.AiQuotaUsageMapper;
import com.ryan.myblog.mapper.AiUsageDailyMapper;
import com.ryan.myblog.model.entity.AiQuotaUsage;
import com.ryan.myblog.service.AiAction;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiUsageServiceImplTest {

    @Mock
    private AiUsageDailyMapper dailyMapper;

    @Mock
    private AiQuotaUsageMapper quotaUsageMapper;

    private AiUsageServiceImpl createService() {
        AiUsageServiceImpl service = new AiUsageServiceImpl(dailyMapper, quotaUsageMapper);
        ReflectionTestUtils.setField(service, "maxRequestsPerDay", 3);
        ReflectionTestUtils.setField(service, "maxTokensPerDay", 50000);
        return service;
    }

    @Test
    void regularUserCannotExceedDailyLimit() {
        AiUsageServiceImpl service = createService();
        when(quotaUsageMapper.insertReservation(any(), eq(9L), any(), eq("CHAT"), eq(10))).thenReturn(1);
        when(dailyMapper.consumeWithinLimit(eq(9L), any(), eq(10), eq(3), eq(50000))).thenReturn(0);

        assertThrows(AiQuotaExceededException.class,
                () -> service.reserve("request-limit", 9L, AiAction.CHAT, 10, false));
    }

    @Test
    void administratorUsesUnlimitedCounter() {
        AiUsageServiceImpl service = createService();
        when(quotaUsageMapper.insertReservation(any(), eq(1L), any(), eq("SUMMARY"), eq(5))).thenReturn(1);
        when(dailyMapper.consumeUnlimited(eq(1L), any(), eq(5))).thenReturn(1);

        service.reserve("admin-request", 1L, AiAction.SUMMARY, 5, true);

        verify(dailyMapper).consumeUnlimited(eq(1L), any(), eq(5));
        verify(dailyMapper, never()).consumeWithinLimit(any(), any(), anyInt(), anyInt(), anyInt());
    }

    @Test
    void duplicateRequestDoesNotTouchDailyCounter() {
        AiUsageServiceImpl service = createService();
        when(quotaUsageMapper.insertReservation(any(), eq(2L), any(), eq("TITLE"), eq(1))).thenReturn(0);

        assertThrows(DuplicateAiRequestException.class,
                () -> service.reserve("duplicate", 2L, AiAction.TITLE, 1, false));
        verify(dailyMapper, never()).insertIfAbsent(any(), any());
    }

    @Test
    void refundOnlyDecrementsOnce() {
        AiUsageServiceImpl service = createService();
        AiQuotaUsage usage = new AiQuotaUsage();
        usage.setRequestId("refund-request");
        usage.setUserId(3L);
        usage.setUsageDate(LocalDate.now());
        usage.setEstimatedTokens(12);
        when(quotaUsageMapper.selectByRequestId("refund-request")).thenReturn(usage);
        when(quotaUsageMapper.transitionReserved("refund-request", "REFUNDED")).thenReturn(1, 0);

        assertTrue(service.refund("refund-request"));
        assertFalse(service.refund("refund-request"));
        verify(dailyMapper).refund(3L, usage.getUsageDate(), 12);
    }

    @Test
    void quotaResponseUsesConfiguredLimit() {
        AiUsageServiceImpl service = createService();
        when(dailyMapper.selectRequestCount(eq(5L), any())).thenReturn(2);

        var quota = service.getQuota(5L, false);

        assertEquals(3, quota.getLimit());
        assertEquals(2, quota.getUsed());
        assertEquals(1, quota.getRemaining());
        assertTrue(quota.isAvailable());
    }
}
