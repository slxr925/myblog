package com.ryan.myblog.ai.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.ai.observability.AiToolExecutionContext;

import java.util.function.Supplier;

final class ToolSupport {

    private static final int SUMMARY_MAX_CHARS = 1000;

    private ToolSupport() {
    }

    static <T> T observe(String toolName,
                         Object arguments,
                         AiObservabilityService observabilityService,
                         ObjectMapper objectMapper,
                         Supplier<T> supplier) {
        long start = System.currentTimeMillis();
        AiToolExecutionContext.Context context = AiToolExecutionContext.get();
        if (context != null) {
            context.incrementToolCallCount();
        }
        try {
            T result = supplier.get();
            observabilityService.recordToolCall(new AiObservabilityService.AiToolCallEvent(
                    context != null ? context.conversationId() : null,
                    context != null ? context.messageId() : null,
                    toolName,
                    toJson(objectMapper, arguments),
                    truncate(toJson(objectMapper, result)),
                    "success",
                    System.currentTimeMillis() - start,
                    null));
            return result;
        } catch (RuntimeException e) {
            observabilityService.recordToolCall(new AiObservabilityService.AiToolCallEvent(
                    context != null ? context.conversationId() : null,
                    context != null ? context.messageId() : null,
                    toolName,
                    toJson(objectMapper, arguments),
                    null,
                    "error",
                    System.currentTimeMillis() - start,
                    e.getMessage()));
            throw e;
        }
    }

    static int clampLimit(Integer limit, int defaultLimit, int maxLimit) {
        if (limit == null || limit <= 0) {
            return defaultLimit;
        }
        return Math.min(limit, maxLimit);
    }

    static String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }

    private static String truncate(String text) {
        return truncate(text, SUMMARY_MAX_CHARS);
    }

    private static String toJson(ObjectMapper objectMapper, Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return String.valueOf(value);
        }
    }
}
