package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class AiQuotaVO {
    private LocalDate date;
    private Integer limit;
    private int used;
    private Integer remaining;
    private boolean available;
    private boolean unlimited;
    private OffsetDateTime resetAt;
}
