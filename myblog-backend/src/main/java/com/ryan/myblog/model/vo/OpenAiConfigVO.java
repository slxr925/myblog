package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * OpenAI运行期配置视图。
 */
@Data
public class OpenAiConfigVO {

    private Boolean aiEnabled;
    private Boolean apiKeyConfigured;
    private String apiKeyMasked;
    private String baseUrl;
    private String model;
    private String completionsPath;
    private Double temperature;
    private Integer maxTokensChat;
    private Integer maxTokensTitle;
    private Integer maxTokensSummary;
    private Integer maxTokensKeywords;
    private Integer maxTokensPolish;
    private Boolean available;
    private Boolean envFileExists;
    private String envFilePath;
    private String lastModifiedAt;

    private Boolean ragEnabled;
    private Integer ragTopK;
    private Double ragSimilarityThreshold;
    private Boolean embeddingEnabled;
    private Boolean embeddingApiKeyConfigured;
    private String embeddingApiKeyMasked;
    private String embeddingBaseUrl;
    private String embeddingPath;
    private String embeddingModel;
    private Integer embeddingDimensions;
    private Boolean embeddingAvailable;
    private Boolean ragAvailable;
    private String ragIndexName;
    private Long ragChunkCount;
    private Boolean ragRebuilding;
    private String ragLastRebuildAt;
}
