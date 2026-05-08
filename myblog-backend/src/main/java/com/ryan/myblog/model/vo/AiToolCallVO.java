package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiToolCallVO {
    private Long id;
    private String conversationId;
    private Long messageId;
    private String toolName;
    private String argumentsJson;
    private String resultSummary;
    private String status;
    private Long elapsedMs;
    private String errorMessage;
    private LocalDateTime createTime;
}
