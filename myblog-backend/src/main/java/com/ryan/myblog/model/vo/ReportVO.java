package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 举报视图对象
 */
@Data
public class ReportVO {
    private Long id;
    private Long reporterId;
    private String reporterName;
    private String targetType;
    private Long targetId;
    private String reason;
    private String detail;
    private Integer status;
    private Long reviewerId;
    private String reviewerName;
    private LocalDateTime reviewTime;
    private String action;
    private String notes;
    private LocalDateTime createTime;
}
