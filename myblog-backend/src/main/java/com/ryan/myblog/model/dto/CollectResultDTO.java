package com.ryan.myblog.model.dto;

import lombok.Data;

/**
 * 收藏操作结果DTO
 */
@Data
public class CollectResultDTO {

    /**
     * 是否已收藏
     */
    private Boolean isCollected;

    /**
     * 操作消息
     */
    private String message;

    /**
     * 收藏夹ID（收藏时返回）
     */
    private Long folderId;

    public CollectResultDTO() {}

    public CollectResultDTO(Boolean isCollected, String message) {
        this.isCollected = isCollected;
        this.message = message;
    }

    public CollectResultDTO(Boolean isCollected, String message, Long folderId) {
        this.isCollected = isCollected;
        this.message = message;
        this.folderId = folderId;
    }
}