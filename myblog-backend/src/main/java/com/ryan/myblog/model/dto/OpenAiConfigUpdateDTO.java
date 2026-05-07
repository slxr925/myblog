package com.ryan.myblog.model.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * OpenAI运行期配置更新DTO。
 */
@Data
public class OpenAiConfigUpdateDTO {

    private Boolean aiEnabled;

    @Size(max = 4096, message = "API Key过长")
    private String apiKey;

    private Boolean clearApiKey = false;

    @Size(max = 512, message = "Base URL过长")
    private String baseUrl;

    @Size(max = 128, message = "模型名称过长")
    private String model;

    @Size(max = 256, message = "Completions Path过长")
    private String completionsPath;

    @DecimalMin(value = "0.0", message = "temperature不能小于0")
    @DecimalMax(value = "2.0", message = "temperature不能大于2")
    private Double temperature;

    private Integer maxTokensChat;

    private Integer maxTokensTitle;

    private Integer maxTokensSummary;

    private Integer maxTokensKeywords;

    private Integer maxTokensPolish;

    private Boolean ragEnabled;

    private Integer ragTopK;

    @DecimalMin(value = "0.0", message = "RAG相似度阈值不能小于0")
    @DecimalMax(value = "1.0", message = "RAG相似度阈值不能大于1")
    private Double ragSimilarityThreshold;

    private Boolean embeddingEnabled;

    @Size(max = 512, message = "Embedding Base URL过长")
    private String embeddingBaseUrl;

    @Size(max = 256, message = "Embedding Path过长")
    private String embeddingPath;

    @Size(max = 128, message = "Embedding模型名称过长")
    private String embeddingModel;

    @Size(max = 4096, message = "Embedding API Key过长")
    private String embeddingApiKey;

    private Boolean clearEmbeddingApiKey = false;

    private Integer embeddingDimensions;
}
