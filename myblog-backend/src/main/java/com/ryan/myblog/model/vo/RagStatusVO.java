package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

/**
 * RAG索引运行状态。
 */
@Data
@Builder
public class RagStatusVO {
    private Boolean enabled;
    private Boolean available;
    private Boolean embeddingAvailable;
    private String indexName;
    private Long chunkCount;
    private Boolean rebuilding;
    private String lastRebuildAt;
    private String message;
}
