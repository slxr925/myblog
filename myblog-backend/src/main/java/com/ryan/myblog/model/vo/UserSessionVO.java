package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户会话视图对象
 */
@Data
public class UserSessionVO {

    private Long sessionId;
    private String ip;
    private String userAgent;
    private String deviceLabel;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
    private Integer status; // 0-正常 1-已吊销
}
