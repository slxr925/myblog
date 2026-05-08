package com.ryan.myblog.ai.observability;

import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.model.vo.AiObservabilityStatsVO;
import com.ryan.myblog.model.vo.AiRequestLogVO;
import com.ryan.myblog.model.vo.AiToolCallVO;

public interface AiObservabilityService {

    void recordRequest(AiRequestEvent event);

    void recordToolCall(AiToolCallEvent event);

    PageResult<AiRequestLogVO> listRequests(int page, int size, String status);

    PageResult<AiToolCallVO> listToolCalls(int page, int size, String status);

    AiObservabilityStatsVO getStats(int days);

    record AiRequestEvent(String requestId,
                          String conversationId,
                          Long userId,
                          String action,
                          String status,
                          String promptKey,
                          String promptVersion,
                          String model,
                          int promptChars,
                          int resultChars,
                          int toolCallCount,
                          long elapsedMs,
                          String errorMessage) {
    }

    record AiToolCallEvent(String conversationId,
                           Long messageId,
                           String toolName,
                           String argumentsJson,
                           String resultSummary,
                           String status,
                           long elapsedMs,
                           String errorMessage) {
    }
}
