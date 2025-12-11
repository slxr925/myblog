package com.ryan.myblog.model.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;

/**
 * 收藏/取消收藏操作DTO
 */
@Data
public class CollectToggleDTO {

    @NotNull(message = "目标ID不能为空")
    private Long targetId;

    @NotNull(message = "目标类型不能为空")
    private String targetType;

    private Long folderId;

    private String note;
}