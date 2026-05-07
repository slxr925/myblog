package com.ryan.myblog.service;

import com.ryan.myblog.model.dto.OpenAiConfigUpdateDTO;
import com.ryan.myblog.model.vo.OpenAiConfigVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.function.Function;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OpenAiRuntimeConfigServiceTest {

    @TempDir
    Path tempDir;

    @Test
    void updateConfigWritesOpenAiKeysAndPreservesUnrelatedEnvLines() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                # database settings
                MYSQL_USERNAME=root
                OPENAI_MODEL=old-model
                JWT_SECRET=keep-me
                """, StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());
        OpenAiConfigUpdateDTO update = new OpenAiConfigUpdateDTO();
        update.setAiEnabled(false);
        update.setApiKey("sk-new");
        update.setBaseUrl("https://api.example.com");
        update.setModel("gpt-test");
        update.setCompletionsPath("/v1/chat/completions");
        update.setTemperature(0.2d);

        OpenAiConfigVO saved = service.updateConfig(update);

        String content = Files.readString(envFile, StandardCharsets.UTF_8);
        assertTrue(content.contains("MYSQL_USERNAME=root"));
        assertTrue(content.contains("JWT_SECRET=keep-me"));
        assertTrue(content.contains("AI_ENABLED=false"));
        assertTrue(content.contains("OPENAI_API_KEY=sk-new"));
        assertTrue(content.contains("OPENAI_BASE_URL=https://api.example.com"));
        assertTrue(content.contains("OPENAI_MODEL=gpt-test"));
        assertTrue(content.contains("OPENAI_COMPLETIONS_PATH=/v1/chat/completions"));
        assertTrue(content.contains("OPENAI_TEMPERATURE=0.2"));
        assertTrue(content.contains("OPENAI_MAX_TOKENS_CHAT=700"));
        assertTrue(content.contains("OPENAI_MAX_TOKENS_TITLE=80"));
        assertTrue(content.contains("OPENAI_MAX_TOKENS_SUMMARY=260"));
        assertTrue(content.contains("OPENAI_MAX_TOKENS_KEYWORDS=120"));
        assertTrue(content.contains("OPENAI_MAX_TOKENS_POLISH=1200"));
        assertTrue(content.contains("RAG_ENABLED=false"));
        assertTrue(content.contains("RAG_TOP_K=5"));
        assertTrue(content.contains("RAG_SIMILARITY_THRESHOLD=0.6"));
        assertTrue(content.contains("EMBEDDING_ENABLED=false"));
        assertTrue(content.contains("EMBEDDING_BASE_URL=https://api.siliconflow.cn"));
        assertTrue(content.contains("EMBEDDING_PATH=/v1/embeddings"));
        assertTrue(content.contains("EMBEDDING_MODEL=BAAI/bge-m3"));
        assertTrue(content.contains("EMBEDDING_DIMENSIONS=1024"));
        assertEquals("gpt-test", saved.getModel());
        assertEquals("sk-***new", saved.getApiKeyMasked());
        assertEquals(700, saved.getMaxTokensChat());
        assertEquals(80, saved.getMaxTokensTitle());
        assertEquals(260, saved.getMaxTokensSummary());
        assertEquals(120, saved.getMaxTokensKeywords());
        assertEquals(1200, saved.getMaxTokensPolish());
        assertEquals(5, saved.getRagTopK());
        assertEquals(0.6d, saved.getRagSimilarityThreshold(), 0.0001d);
    }

    @Test
    void updateConfigWritesIndependentEmbeddingKeysAndMasksSecret() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, "OPENAI_API_KEY=chat-secret\n", StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());
        OpenAiConfigUpdateDTO update = new OpenAiConfigUpdateDTO();
        update.setRagEnabled(true);
        update.setEmbeddingEnabled(true);
        update.setEmbeddingBaseUrl("https://api.siliconflow.cn");
        update.setEmbeddingPath("/v1/embeddings");
        update.setEmbeddingModel("BAAI/bge-m3");
        update.setEmbeddingApiKey("sk-embedding-secret");
        update.setEmbeddingDimensions(1024);

        OpenAiConfigVO saved = service.updateConfig(update);

        String content = Files.readString(envFile, StandardCharsets.UTF_8);
        assertTrue(content.contains("OPENAI_API_KEY=chat-secret"));
        assertTrue(content.contains("RAG_ENABLED=true"));
        assertTrue(content.contains("EMBEDDING_ENABLED=true"));
        assertTrue(content.contains("EMBEDDING_BASE_URL=https://api.siliconflow.cn"));
        assertTrue(content.contains("EMBEDDING_PATH=/v1/embeddings"));
        assertTrue(content.contains("EMBEDDING_MODEL=BAAI/bge-m3"));
        assertTrue(content.contains("EMBEDDING_API_KEY=sk-embedding-secret"));
        assertTrue(content.contains("EMBEDDING_DIMENSIONS=1024"));
        assertEquals("sk-***ret", saved.getEmbeddingApiKeyMasked());
        assertEquals("BAAI/bge-m3", saved.getEmbeddingModel());
    }

    @Test
    void blankApiKeyPreservesExistingSecretUnlessClearIsRequested() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, "OPENAI_API_KEY=sk-existing\n", StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());
        OpenAiConfigUpdateDTO preserve = new OpenAiConfigUpdateDTO();
        preserve.setApiKey("");
        service.updateConfig(preserve);

        assertTrue(Files.readString(envFile, StandardCharsets.UTF_8).contains("OPENAI_API_KEY=sk-existing"));

        OpenAiConfigUpdateDTO clear = new OpenAiConfigUpdateDTO();
        clear.setApiKey("");
        clear.setClearApiKey(true);
        service.updateConfig(clear);

        assertTrue(Files.readString(envFile, StandardCharsets.UTF_8).contains("OPENAI_API_KEY="));
    }

    @Test
    void readsActionSpecificMaxTokensFromEnvFile() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                OPENAI_MAX_TOKENS_CHAT=500
                OPENAI_MAX_TOKENS_TITLE=60
                OPENAI_MAX_TOKENS_SUMMARY=180
                OPENAI_MAX_TOKENS_KEYWORDS=90
                OPENAI_MAX_TOKENS_POLISH=900
                """, StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());

        assertEquals(500, service.getConfig().getMaxTokensChat());
        assertEquals(60, service.getMaxTokens(AiAction.TITLE));
        assertEquals(180, service.getMaxTokens(AiAction.SUMMARY));
        assertEquals(90, service.getMaxTokens(AiAction.KEYWORDS));
        assertEquals(900, service.getMaxTokens(AiAction.POLISH));
    }

    @Test
    void readsRagSearchControlsFromEnvFile() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                RAG_TOP_K=8
                RAG_SIMILARITY_THRESHOLD=0.55
                """, StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());
        OpenAiConfigVO config = service.getConfig();

        assertEquals(8, config.getRagTopK());
        assertEquals(0.55d, config.getRagSimilarityThreshold(), 0.0001d);
        assertEquals(8, service.getRagTopK());
        assertEquals(0.55d, service.getRagSimilarityThreshold(), 0.0001d);
    }

    @Test
    void usesDeepSeekFlashDefaultsWhenProviderConfigIsMissing() {
        Path envFile = tempDir.resolve(".env");

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, emptyFallback());

        OpenAiConfigVO config = service.getConfig();
        assertEquals("https://api.deepseek.com", config.getBaseUrl());
        assertEquals("deepseek-v4-flash", config.getModel());
        assertEquals("/chat/completions", config.getCompletionsPath());
    }

    @Test
    void updateConfigRestoresCriticalRuntimeKeysWhenEnvFileIsIncomplete() throws Exception {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                AI_ENABLED=true
                OPENAI_API_KEY=sk-existing
                OPENAI_MODEL=glm-5.1
                """, StandardCharsets.UTF_8);

        OpenAiRuntimeConfigService service = new OpenAiRuntimeConfigService(envFile, fromMap(Map.of(
                "MYSQL_PASSWORD", "db-secret",
                "JWT_SECRET", "jwt-secret",
                "MYSQL_HOST", "172.17.0.1"
        )));

        OpenAiConfigUpdateDTO update = new OpenAiConfigUpdateDTO();
        update.setTemperature(0.4d);
        service.updateConfig(update);

        String content = Files.readString(envFile, StandardCharsets.UTF_8);
        assertTrue(content.contains("MYSQL_PASSWORD=db-secret"));
        assertTrue(content.contains("JWT_SECRET=jwt-secret"));
        assertTrue(content.contains("MYSQL_HOST=172.17.0.1"));
        assertTrue(content.contains("OPENAI_TEMPERATURE=0.4"));
    }

    private Function<String, String> emptyFallback() {
        return key -> null;
    }

    private Function<String, String> fromMap(Map<String, String> values) {
        return values::get;
    }
}
