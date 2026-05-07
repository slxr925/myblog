package com.ryan.myblog.model.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * RAG检索命中的文章片段。
 */
@Data
@Builder
public class RagSearchResult {
    private Long blogId;
    private String publicId;
    private String title;
    private Long categoryId;
    private String categoryName;
    private List<TagVO> tags;
    private String publishTime;
    private Integer chunkIndex;
    private String snippet;
    private Double score;
    private Double vectorScore;
    private Double keywordScore;
    private Double rerankScore;
    private String matchSource;
}
