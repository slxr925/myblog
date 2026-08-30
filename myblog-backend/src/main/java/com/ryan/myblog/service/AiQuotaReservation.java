package com.ryan.myblog.service;

import java.time.LocalDate;

public record AiQuotaReservation(
        String requestId,
        Long userId,
        LocalDate usageDate,
        AiAction action,
        int estimatedTokens,
        boolean unlimited) {
}
