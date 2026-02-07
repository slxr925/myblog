package com.ryan.myblog.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 举报审核DTO
 */
@Data
public class ReportReviewDTO {

    @NotNull(message = "状态不能为空")
    private Integer status;

    private String action;

    private String notes;
}
