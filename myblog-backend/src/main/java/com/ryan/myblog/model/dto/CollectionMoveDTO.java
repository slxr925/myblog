package com.ryan.myblog.model.dto;

import lombok.Data;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 批量移动收藏DTO
 */
@Data
public class CollectionMoveDTO {

    @NotNull(message = "目标文件夹ID不能为空")
    private Long targetFolderId;

    @NotEmpty(message = "收藏ID列表不能为空")
    private List<Long> collectionIds;
}