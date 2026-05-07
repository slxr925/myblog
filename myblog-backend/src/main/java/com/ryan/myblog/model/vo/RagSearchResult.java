package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

/**
 * RAG检索命中的文章片段。
 */
@Data
@Builder
public class RagSearchResult {
    private Long blogId;
    private String publicId;
    private String title;
    private Integer chunkIndex;
    private String snippet;
    private Double score;
}
