package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AiMessageVO {
    private Long id;
    private String role;
    private String content;
    private Integer tokenEstimate;
    private LocalDateTime createTime;
}
