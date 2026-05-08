package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiRequestLogVO {
    private Long id;
    private String requestId;
    private String conversationId;
    private Long userId;
    private String action;
    private String status;
    private String promptKey;
    private String promptVersion;
    private String model;
    private Integer promptChars;
    private Integer resultChars;
    private Integer toolCallCount;
    private Long elapsedMs;
    private String errorMessage;
    private LocalDateTime createTime;
}
