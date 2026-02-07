package com.ryan.myblog.model.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 收藏夹分类创建/更新DTO
 */
@Data
public class CollectionFolderDTO {

    @NotBlank(message = "分类名称不能为空")
    @Size(max = 50, message = "分类名称长度不能超过50个字符")
    private String name;

    @Size(max = 255, message = "描述长度不能超过255个字符")
    private String description;

    private Integer sortOrder;

    private Boolean isPublic;
}
