package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiObservabilityStatsVO {
    private Long requestCount;
    private Long successCount;
    private Long errorCount;
    private Double averageElapsedMs;
    private Long toolCallCount;
    private Long toolErrorCount;
}
