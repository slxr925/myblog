package com.ryan.myblog.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiQuotaCleanupScheduler {

    private final AiUsageService aiUsageService;

    @Scheduled(fixedDelay = 60_000L, initialDelay = 60_000L)
    public void refundStaleReservations() {
        int refunded = aiUsageService.refundStaleReservations();
        if (refunded > 0) {
            log.info("已返还 {} 条超时 AI 配额预占", refunded);
        }
    }
}
