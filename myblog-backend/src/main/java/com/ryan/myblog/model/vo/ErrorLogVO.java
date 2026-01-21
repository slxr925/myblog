package com.ryan.myblog.model.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 错误日志VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorLogVO {

    /**
     * 错误ID
     */
    private String errorId;

    /**
     * 时间戳
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;

    /**
     * HTTP状态码
     */
    private Integer status;

    /**
     * 请求方法
     */
    private String method;

    /**
     * 请求URI
     */
    private String uri;

    /**
     * 错误类型
     */
    private String errorType;

    /**
     * 错误消息
     */
    private String message;

    /**
     * 请求IP
     */
    private String ip;

    /**
     * 用户ID（如果已登录）
     */
    private Long userId;

    /**
     * 用户名（如果已登录）
     */
    private String username;

    /**
     * User-Agent
     */
    private String userAgent;

    /**
     * 堆栈跟踪（可选，仅开发环境）
     */
    private String stackTrace;
}
