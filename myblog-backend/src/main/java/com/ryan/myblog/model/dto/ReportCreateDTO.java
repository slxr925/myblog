package com.ryan.myblog.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 举报创建DTO
 */
@Data
public class ReportCreateDTO {

    @NotBlank(message = "目标类型不能为空")
    private String targetType;

    @NotNull(message = "目标ID不能为空")
    private Long targetId;

    private String reason;

    private String detail;
}
