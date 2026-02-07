package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDate;

/**
 * AI每日使用统计视图
 */
@Data
public class AiUsageDailyVO {
    private LocalDate date;
    private Integer requestCount;
    private Integer tokenCount;
}
