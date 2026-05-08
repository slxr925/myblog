package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiConversationVO {
    private String conversationId;
    private Long userId;
    private String title;
    private String summary;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private List<AiMessageVO> messages;
}
