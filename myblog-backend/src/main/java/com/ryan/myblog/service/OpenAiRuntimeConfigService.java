package com.ryan.myblog.service;

import com.ryan.myblog.model.dto.OpenAiConfigUpdateDTO;
import com.ryan.myblog.model.vo.OpenAiConfigVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * 管理OpenAI相关.env配置，并提供可热更新的ChatClient。
 */
@Slf4j
@Service
public class OpenAiRuntimeConfigService {

    private static final String KEY_AI_ENABLED = "AI_ENABLED";
    private static final String KEY_API_KEY = "OPENAI_API_KEY";
    private static final String KEY_BASE_URL = "OPENAI_BASE_URL";
    private static final String KEY_MODEL = "OPENAI_MODEL";
    private static final String KEY_COMPLETIONS_PATH = "OPENAI_COMPLETIONS_PATH";
    private static final String KEY_TEMPERATURE = "OPENAI_TEMPERATURE";
    private static final String KEY_MAX_TOKENS_CHAT = "OPENAI_MAX_TOKENS_CHAT";
    private static final String KEY_MAX_TOKENS_TITLE = "OPENAI_MAX_TOKENS_TITLE";
    private static final String KEY_MAX_TOKENS_SUMMARY = "OPENAI_MAX_TOKENS_SUMMARY";
    private static final String KEY_MAX_TOKENS_KEYWORDS = "OPENAI_MAX_TOKENS_KEYWORDS";
    private static final String KEY_MAX_TOKENS_POLISH = "OPENAI_MAX_TOKENS_POLISH";
    private static final String KEY_RAG_ENABLED = "RAG_ENABLED";
    private static final String KEY_RAG_TOP_K = "RAG_TOP_K";
    private static final String KEY_RAG_SIMILARITY_THRESHOLD = "RAG_SIMILARITY_THRESHOLD";
    private static final String KEY_EMBEDDING_ENABLED = "EMBEDDING_ENABLED";
    private static final String KEY_EMBEDDING_BASE_URL = "EMBEDDING_BASE_URL";
    private static final String KEY_EMBEDDING_PATH = "EMBEDDING_PATH";
    private static final String KEY_EMBEDDING_MODEL = "EMBEDDING_MODEL";
    private static final String KEY_EMBEDDING_API_KEY = "EMBEDDING_API_KEY";
    private static final String KEY_EMBEDDING_DIMENSIONS = "EMBEDDING_DIMENSIONS";

    private static final String DEFAULT_BASE_URL = "https://api.deepseek.com";
    private static final String DEFAULT_MODEL = "deepseek-v4-flash";
    private static final String DEFAULT_COMPLETIONS_PATH = "/chat/completions";
    private static final String DEFAULT_EMBEDDING_BASE_URL = "https://api.siliconflow.cn";
    private static final String DEFAULT_EMBEDDING_PATH = "/v1/embeddings";
    private static final String DEFAULT_EMBEDDING_MODEL = "BAAI/bge-m3";

    private static final int DEFAULT_MAX_TOKENS_CHAT = 700;
    private static final int DEFAULT_MAX_TOKENS_TITLE = 80;
    private static final int DEFAULT_MAX_TOKENS_SUMMARY = 260;
    private static final int DEFAULT_MAX_TOKENS_KEYWORDS = 120;
    private static final int DEFAULT_MAX_TOKENS_POLISH = 1200;
    private static final int DEFAULT_RAG_TOP_K = 5;
    private static final double DEFAULT_RAG_SIMILARITY_THRESHOLD = 0.6d;
    private static final int DEFAULT_EMBEDDING_DIMENSIONS = 1024;

    private static final List<String> MANAGED_KEYS = List.of(
            KEY_AI_ENABLED,
            KEY_API_KEY,
            KEY_BASE_URL,
            KEY_MODEL,
            KEY_COMPLETIONS_PATH,
            KEY_TEMPERATURE,
            KEY_MAX_TOKENS_CHAT,
            KEY_MAX_TOKENS_TITLE,
            KEY_MAX_TOKENS_SUMMARY,
            KEY_MAX_TOKENS_KEYWORDS,
            KEY_MAX_TOKENS_POLISH,
            KEY_RAG_ENABLED,
            KEY_RAG_TOP_K,
            KEY_RAG_SIMILARITY_THRESHOLD,
            KEY_EMBEDDING_ENABLED,
            KEY_EMBEDDING_BASE_URL,
            KEY_EMBEDDING_PATH,
            KEY_EMBEDDING_MODEL,
            KEY_EMBEDDING_API_KEY,
            KEY_EMBEDDING_DIMENSIONS
    );

    private static final List<String> PASSTHROUGH_KEYS = List.of(
            "MYSQL_HOST",
            "MYSQL_PORT",
            "MYSQL_DATABASE",
            "MYSQL_USERNAME",
            "MYSQL_PASSWORD",
            "REDIS_HOST",
            "REDIS_PORT",
            "REDIS_PASSWORD",
            "ELASTICSEARCH_ENABLED",
            "ELASTICSEARCH_HOST",
            "ELASTICSEARCH_PORT",
            "ELASTICSEARCH_USERNAME",
            "ELASTICSEARCH_PASSWORD",
            "SPRING_KAFKA_BOOTSTRAP_SERVERS",
            "JWT_SECRET"
    );

    private final Path envFile;
    private final Function<String, String> fallback;
    private volatile RuntimeState runtimeState;

    @Autowired
    public OpenAiRuntimeConfigService(
            @Value("${app.env.config-file:${ENV_CONFIG_FILE:.env}}") String envFilePath,
            Environment environment) {
        this(resolvePath(envFilePath), key -> readFromEnvironment(environment, key));
    }

    public OpenAiRuntimeConfigService(Path envFile, Function<String, String> fallback) {
        this.envFile = envFile.toAbsolutePath().normalize();
        this.fallback = fallback;
        this.runtimeState = loadRuntimeState();
    }

    public OpenAiConfigVO getConfig() {
        return toVO(currentState());
    }

    public synchronized OpenAiConfigVO updateConfig(OpenAiConfigUpdateDTO update) {
        OpenAiConfigSnapshot current = currentState().config();
        OpenAiConfigSnapshot next = merge(current, update);
        try {
            writeEnvFile(next);
        } catch (IOException e) {
            throw new IllegalStateException("写入.env配置失败: " + e.getMessage(), e);
        }
        runtimeState = loadRuntimeState();
        return toVO(runtimeState);
    }

    public boolean isAiAvailable() {
        RuntimeState state = currentState();
        return state.chatClient() != null && state.config().aiEnabled() && hasText(state.config().apiKey());
    }

    public ChatClient getChatClient() {
        return currentState().chatClient();
    }

    public EmbeddingModel getEmbeddingModel() {
        return currentState().embeddingModel();
    }

    public boolean isRagAvailable() {
        RuntimeState state = currentState();
        OpenAiConfigSnapshot config = state.config();
        return config.ragEnabled() && config.embeddingEnabled() && hasText(config.embeddingApiKey())
                && state.embeddingModel() != null;
    }

    public int getEmbeddingDimensions() {
        return currentState().config().embeddingDimensions();
    }

    public int getRagTopK() {
        return currentState().config().ragTopK();
    }

    public double getRagSimilarityThreshold() {
        return currentState().config().ragSimilarityThreshold();
    }

    public String getEmbeddingFingerprint() {
        OpenAiConfigSnapshot config = currentState().config();
        return config.ragEnabled() + "|" + config.embeddingEnabled() + "|" + config.embeddingBaseUrl() + "|"
                + config.embeddingPath() + "|" + config.embeddingModel() + "|" + config.embeddingDimensions() + "|"
                + config.embeddingApiKeyHash() + "|" + currentState().lastModifiedMillis();
    }

    public String getRuntimeFingerprint() {
        OpenAiConfigSnapshot config = currentState().config();
        return config.baseUrl() + "|" + config.model() + "|" + config.completionsPath() + "|" + config.temperature() + "|"
                + config.maxTokensChat() + "|" + config.maxTokensTitle() + "|" + config.maxTokensSummary() + "|"
                + config.maxTokensKeywords() + "|" + config.maxTokensPolish() + "|" + config.ragEnabled() + "|"
                + config.ragTopK() + "|" + config.ragSimilarityThreshold() + "|" + config.apiKeyHash() + "|"
                + currentState().lastModifiedMillis();
    }

    public int getMaxTokens(AiAction action) {
        OpenAiConfigSnapshot config = currentState().config();
        return switch (action) {
            case CHAT -> config.maxTokensChat();
            case TITLE -> config.maxTokensTitle();
            case SUMMARY -> config.maxTokensSummary();
            case KEYWORDS -> config.maxTokensKeywords();
            case POLISH -> config.maxTokensPolish();
        };
    }

    public OpenAiChatOptions getChatOptions(AiAction action) {
        OpenAiConfigSnapshot config = currentState().config();
        OpenAiChatOptions.Builder builder = OpenAiChatOptions.builder()
                .model(config.model())
                .temperature(config.temperature())
                .maxTokens(getMaxTokens(action));
        applyProviderCompatibilityOptions(builder, config);
        return builder.build();
    }

    private RuntimeState currentState() {
        RuntimeState state = runtimeState;
        long modifiedMillis = getLastModifiedMillis();
        if (state.lastModifiedMillis() == modifiedMillis) {
            return state;
        }
        synchronized (this) {
            if (runtimeState.lastModifiedMillis() != modifiedMillis) {
                runtimeState = loadRuntimeState();
            }
            return runtimeState;
        }
    }

    private RuntimeState loadRuntimeState() {
        OpenAiConfigSnapshot config = readConfig();
        ChatClient chatClient = buildChatClient(config);
        EmbeddingModel embeddingModel = buildEmbeddingModel(config);
        long modifiedMillis = getLastModifiedMillis();
        return new RuntimeState(config, chatClient, embeddingModel, modifiedMillis);
    }

    private OpenAiConfigSnapshot readConfig() {
        Map<String, String> values = readEnvValues();
        boolean enabled = parseBoolean(firstValue(values, KEY_AI_ENABLED, "spring.ai.enabled", "false"));
        String apiKey = firstValue(values, KEY_API_KEY, "spring.ai.openai.api-key", "");
        String baseUrl = firstValue(values, KEY_BASE_URL, "spring.ai.openai.base-url", DEFAULT_BASE_URL);
        String model = firstValue(values, KEY_MODEL, "spring.ai.openai.chat.options.model", DEFAULT_MODEL);
        String completionsPath = firstValue(values, KEY_COMPLETIONS_PATH, "spring.ai.openai.chat.completions-path", DEFAULT_COMPLETIONS_PATH);
        double temperature = parseDouble(firstValue(values, KEY_TEMPERATURE, "spring.ai.openai.chat.options.temperature", "0.7"), 0.7d);
        int maxTokensChat = parsePositiveInt(firstValue(values, KEY_MAX_TOKENS_CHAT, "spring.ai.openai.chat.options.max-tokens-chat", String.valueOf(DEFAULT_MAX_TOKENS_CHAT)), DEFAULT_MAX_TOKENS_CHAT);
        int maxTokensTitle = parsePositiveInt(firstValue(values, KEY_MAX_TOKENS_TITLE, "spring.ai.openai.chat.options.max-tokens-title", String.valueOf(DEFAULT_MAX_TOKENS_TITLE)), DEFAULT_MAX_TOKENS_TITLE);
        int maxTokensSummary = parsePositiveInt(firstValue(values, KEY_MAX_TOKENS_SUMMARY, "spring.ai.openai.chat.options.max-tokens-summary", String.valueOf(DEFAULT_MAX_TOKENS_SUMMARY)), DEFAULT_MAX_TOKENS_SUMMARY);
        int maxTokensKeywords = parsePositiveInt(firstValue(values, KEY_MAX_TOKENS_KEYWORDS, "spring.ai.openai.chat.options.max-tokens-keywords", String.valueOf(DEFAULT_MAX_TOKENS_KEYWORDS)), DEFAULT_MAX_TOKENS_KEYWORDS);
        int maxTokensPolish = parsePositiveInt(firstValue(values, KEY_MAX_TOKENS_POLISH, "spring.ai.openai.chat.options.max-tokens-polish", String.valueOf(DEFAULT_MAX_TOKENS_POLISH)), DEFAULT_MAX_TOKENS_POLISH);
        boolean ragEnabled = parseBoolean(firstValue(values, KEY_RAG_ENABLED, "app.rag.enabled", "false"));
        int ragTopK = parsePositiveInt(firstValue(values, KEY_RAG_TOP_K, "app.rag.top-k", String.valueOf(DEFAULT_RAG_TOP_K)), DEFAULT_RAG_TOP_K);
        double ragSimilarityThreshold = parseSimilarityThreshold(firstValue(values, KEY_RAG_SIMILARITY_THRESHOLD, "app.rag.similarity-threshold", String.valueOf(DEFAULT_RAG_SIMILARITY_THRESHOLD)), DEFAULT_RAG_SIMILARITY_THRESHOLD);
        boolean embeddingEnabled = parseBoolean(firstValue(values, KEY_EMBEDDING_ENABLED, "app.rag.embedding.enabled", "false"));
        String embeddingBaseUrl = firstValue(values, KEY_EMBEDDING_BASE_URL, "app.rag.embedding.base-url", DEFAULT_EMBEDDING_BASE_URL);
        String embeddingPath = firstValue(values, KEY_EMBEDDING_PATH, "app.rag.embedding.path", DEFAULT_EMBEDDING_PATH);
        String embeddingModel = firstValue(values, KEY_EMBEDDING_MODEL, "app.rag.embedding.model", DEFAULT_EMBEDDING_MODEL);
        String embeddingApiKey = firstValue(values, KEY_EMBEDDING_API_KEY, "app.rag.embedding.api-key", "");
        int embeddingDimensions = parsePositiveInt(firstValue(values, KEY_EMBEDDING_DIMENSIONS, "app.rag.embedding.dimensions", String.valueOf(DEFAULT_EMBEDDING_DIMENSIONS)), DEFAULT_EMBEDDING_DIMENSIONS);
        return new OpenAiConfigSnapshot(enabled, trimToEmpty(apiKey), trimToDefault(baseUrl, DEFAULT_BASE_URL),
                trimToDefault(model, DEFAULT_MODEL), trimToDefault(completionsPath, DEFAULT_COMPLETIONS_PATH), temperature,
                maxTokensChat, maxTokensTitle, maxTokensSummary, maxTokensKeywords, maxTokensPolish,
                ragEnabled, ragTopK, ragSimilarityThreshold,
                embeddingEnabled, trimToDefault(embeddingBaseUrl, DEFAULT_EMBEDDING_BASE_URL),
                trimToDefault(embeddingPath, DEFAULT_EMBEDDING_PATH),
                trimToDefault(embeddingModel, DEFAULT_EMBEDDING_MODEL), trimToEmpty(embeddingApiKey),
                embeddingDimensions);
    }

    private Map<String, String> readEnvValues() {
        Map<String, String> values = new LinkedHashMap<>();
        if (!Files.isRegularFile(envFile)) {
            return values;
        }
        try {
            for (String line : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                ParsedLine parsed = parseEnvLine(line);
                if (parsed != null) {
                    values.put(parsed.key(), parsed.value());
                }
            }
        } catch (IOException e) {
            log.warn("读取.env配置失败: {}", e.getMessage());
        }
        return values;
    }

    private OpenAiConfigSnapshot merge(OpenAiConfigSnapshot current, OpenAiConfigUpdateDTO update) {
        if (update == null) {
            return current;
        }
        String apiKey = current.apiKey();
        if (Boolean.TRUE.equals(update.getClearApiKey())) {
            apiKey = "";
        } else if (hasText(update.getApiKey())) {
            apiKey = update.getApiKey().trim();
        }
        String embeddingApiKey = current.embeddingApiKey();
        if (Boolean.TRUE.equals(update.getClearEmbeddingApiKey())) {
            embeddingApiKey = "";
        } else if (hasText(update.getEmbeddingApiKey())) {
            embeddingApiKey = update.getEmbeddingApiKey().trim();
        }
        return new OpenAiConfigSnapshot(
                update.getAiEnabled() != null ? update.getAiEnabled() : current.aiEnabled(),
                apiKey,
                hasText(update.getBaseUrl()) ? update.getBaseUrl().trim() : current.baseUrl(),
                hasText(update.getModel()) ? update.getModel().trim() : current.model(),
                hasText(update.getCompletionsPath()) ? update.getCompletionsPath().trim() : current.completionsPath(),
                update.getTemperature() != null ? update.getTemperature() : current.temperature(),
                normalizeMaxTokens(update.getMaxTokensChat(), current.maxTokensChat(), DEFAULT_MAX_TOKENS_CHAT),
                normalizeMaxTokens(update.getMaxTokensTitle(), current.maxTokensTitle(), DEFAULT_MAX_TOKENS_TITLE),
                normalizeMaxTokens(update.getMaxTokensSummary(), current.maxTokensSummary(), DEFAULT_MAX_TOKENS_SUMMARY),
                normalizeMaxTokens(update.getMaxTokensKeywords(), current.maxTokensKeywords(), DEFAULT_MAX_TOKENS_KEYWORDS),
                normalizeMaxTokens(update.getMaxTokensPolish(), current.maxTokensPolish(), DEFAULT_MAX_TOKENS_POLISH),
                update.getRagEnabled() != null ? update.getRagEnabled() : current.ragEnabled(),
                normalizeMaxTokens(update.getRagTopK(), current.ragTopK(), DEFAULT_RAG_TOP_K),
                normalizeSimilarityThreshold(update.getRagSimilarityThreshold(), current.ragSimilarityThreshold(), DEFAULT_RAG_SIMILARITY_THRESHOLD),
                update.getEmbeddingEnabled() != null ? update.getEmbeddingEnabled() : current.embeddingEnabled(),
                hasText(update.getEmbeddingBaseUrl()) ? update.getEmbeddingBaseUrl().trim() : current.embeddingBaseUrl(),
                hasText(update.getEmbeddingPath()) ? update.getEmbeddingPath().trim() : current.embeddingPath(),
                hasText(update.getEmbeddingModel()) ? update.getEmbeddingModel().trim() : current.embeddingModel(),
                embeddingApiKey,
                normalizeMaxTokens(update.getEmbeddingDimensions(), current.embeddingDimensions(), DEFAULT_EMBEDDING_DIMENSIONS)
        );
    }

    private void writeEnvFile(OpenAiConfigSnapshot config) throws IOException {
        Path parent = envFile.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        List<String> originalLines = Files.isRegularFile(envFile)
                ? Files.readAllLines(envFile, StandardCharsets.UTF_8)
                : new ArrayList<>();
        Map<String, String> nextValues = new LinkedHashMap<>();
        nextValues.put(KEY_AI_ENABLED, Boolean.toString(config.aiEnabled()));
        nextValues.put(KEY_API_KEY, config.apiKey());
        nextValues.put(KEY_BASE_URL, config.baseUrl());
        nextValues.put(KEY_MODEL, config.model());
        nextValues.put(KEY_COMPLETIONS_PATH, config.completionsPath());
        nextValues.put(KEY_TEMPERATURE, formatDouble(config.temperature()));
        nextValues.put(KEY_MAX_TOKENS_CHAT, String.valueOf(config.maxTokensChat()));
        nextValues.put(KEY_MAX_TOKENS_TITLE, String.valueOf(config.maxTokensTitle()));
        nextValues.put(KEY_MAX_TOKENS_SUMMARY, String.valueOf(config.maxTokensSummary()));
        nextValues.put(KEY_MAX_TOKENS_KEYWORDS, String.valueOf(config.maxTokensKeywords()));
        nextValues.put(KEY_MAX_TOKENS_POLISH, String.valueOf(config.maxTokensPolish()));
        nextValues.put(KEY_RAG_ENABLED, Boolean.toString(config.ragEnabled()));
        nextValues.put(KEY_RAG_TOP_K, String.valueOf(config.ragTopK()));
        nextValues.put(KEY_RAG_SIMILARITY_THRESHOLD, formatDouble(config.ragSimilarityThreshold()));
        nextValues.put(KEY_EMBEDDING_ENABLED, Boolean.toString(config.embeddingEnabled()));
        nextValues.put(KEY_EMBEDDING_BASE_URL, config.embeddingBaseUrl());
        nextValues.put(KEY_EMBEDDING_PATH, config.embeddingPath());
        nextValues.put(KEY_EMBEDDING_MODEL, config.embeddingModel());
        nextValues.put(KEY_EMBEDDING_API_KEY, config.embeddingApiKey());
        nextValues.put(KEY_EMBEDDING_DIMENSIONS, String.valueOf(config.embeddingDimensions()));

        Set<String> written = new LinkedHashSet<>();
        List<String> nextLines = new ArrayList<>();
        for (String line : originalLines) {
            ParsedLine parsed = parseEnvLine(line);
            if (parsed == null || !nextValues.containsKey(parsed.key())) {
                nextLines.add(line);
                continue;
            }
            if (written.add(parsed.key())) {
                nextLines.add(parsed.key() + "=" + formatEnvValue(nextValues.get(parsed.key())));
            }
        }
        for (String key : PASSTHROUGH_KEYS) {
            if (written.contains(key)) {
                continue;
            }
            String fallbackValue = fallback.apply(key);
            if (fallbackValue != null) {
                written.add(key);
                nextLines.add(key + "=" + formatEnvValue(fallbackValue));
            }
        }
        for (String key : MANAGED_KEYS) {
            if (written.add(key)) {
                nextLines.add(key + "=" + formatEnvValue(nextValues.get(key)));
            }
        }

        Path tempFile = Files.createTempFile(parent != null ? parent : Path.of("."), ".env", ".tmp");
        String content = String.join(System.lineSeparator(), nextLines) + System.lineSeparator();
        Files.writeString(tempFile, content, StandardCharsets.UTF_8);
        try {
            Files.move(tempFile, envFile, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException atomicMoveFailure) {
            try {
                Files.move(tempFile, envFile, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException moveFailure) {
                Files.writeString(envFile, content, StandardCharsets.UTF_8);
                Files.deleteIfExists(tempFile);
            }
        }
    }

    private ChatClient buildChatClient(OpenAiConfigSnapshot config) {
        if (!config.aiEnabled() || !hasText(config.apiKey())) {
            return null;
        }
        try {
            OpenAiApi openAiApi = OpenAiApi.builder()
                    .baseUrl(config.baseUrl())
                    .apiKey(config.apiKey())
                    .completionsPath(config.completionsPath())
                    .build();
            OpenAiChatOptions.Builder optionsBuilder = OpenAiChatOptions.builder()
                    .model(config.model())
                    .temperature(config.temperature())
                    .maxTokens(config.maxTokensChat());
            applyProviderCompatibilityOptions(optionsBuilder, config);
            OpenAiChatOptions options = optionsBuilder.build();
            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .openAiApi(openAiApi)
                    .defaultOptions(options)
                    .build();
            return ChatClient.builder(chatModel).build();
        } catch (Exception e) {
            log.error("OpenAI运行期配置加载失败: {}", e.getMessage(), e);
            return null;
        }
    }

    private void applyProviderCompatibilityOptions(OpenAiChatOptions.Builder builder, OpenAiConfigSnapshot config) {
        if (shouldDisableDeepSeekThinking(config)) {
            builder.extraBody(Map.of("thinking", Map.of("type", "disabled")));
        }
    }

    private boolean shouldDisableDeepSeekThinking(OpenAiConfigSnapshot config) {
        String baseUrl = trimToEmpty(config.baseUrl()).toLowerCase();
        String model = trimToEmpty(config.model()).toLowerCase();
        return baseUrl.contains("deepseek") && model.startsWith("deepseek-v4");
    }

    private EmbeddingModel buildEmbeddingModel(OpenAiConfigSnapshot config) {
        if (!config.embeddingEnabled() || !hasText(config.embeddingApiKey())) {
            return null;
        }
        try {
            OpenAiApi openAiApi = OpenAiApi.builder()
                    .baseUrl(config.embeddingBaseUrl())
                    .apiKey(config.embeddingApiKey())
                    .embeddingsPath(config.embeddingPath())
                    .build();
            OpenAiEmbeddingOptions options = OpenAiEmbeddingOptions.builder()
                    .model(config.embeddingModel())
                    .encodingFormat("float")
                    .build();
            return new OpenAiEmbeddingModel(openAiApi, MetadataMode.EMBED, options);
        } catch (Exception e) {
            log.error("Embedding运行期配置加载失败: {}", e.getMessage(), e);
            return null;
        }
    }

    private OpenAiConfigVO toVO(RuntimeState state) {
        OpenAiConfigSnapshot config = state.config();
        OpenAiConfigVO vo = new OpenAiConfigVO();
        vo.setAiEnabled(config.aiEnabled());
        vo.setApiKeyConfigured(hasText(config.apiKey()));
        vo.setApiKeyMasked(maskApiKey(config.apiKey()));
        vo.setBaseUrl(config.baseUrl());
        vo.setModel(config.model());
        vo.setCompletionsPath(config.completionsPath());
        vo.setTemperature(config.temperature());
        vo.setMaxTokensChat(config.maxTokensChat());
        vo.setMaxTokensTitle(config.maxTokensTitle());
        vo.setMaxTokensSummary(config.maxTokensSummary());
        vo.setMaxTokensKeywords(config.maxTokensKeywords());
        vo.setMaxTokensPolish(config.maxTokensPolish());
        vo.setAvailable(state.chatClient() != null && config.aiEnabled() && hasText(config.apiKey()));
        vo.setEnvFileExists(Files.isRegularFile(envFile));
        vo.setEnvFilePath(envFile.toString());
        vo.setLastModifiedAt(state.lastModifiedMillis() > 0 ? Instant.ofEpochMilli(state.lastModifiedMillis()).toString() : null);
        vo.setRagEnabled(config.ragEnabled());
        vo.setRagTopK(config.ragTopK());
        vo.setRagSimilarityThreshold(config.ragSimilarityThreshold());
        vo.setEmbeddingEnabled(config.embeddingEnabled());
        vo.setEmbeddingApiKeyConfigured(hasText(config.embeddingApiKey()));
        vo.setEmbeddingApiKeyMasked(maskApiKey(config.embeddingApiKey()));
        vo.setEmbeddingBaseUrl(config.embeddingBaseUrl());
        vo.setEmbeddingPath(config.embeddingPath());
        vo.setEmbeddingModel(config.embeddingModel());
        vo.setEmbeddingDimensions(config.embeddingDimensions());
        vo.setEmbeddingAvailable(state.embeddingModel() != null && config.embeddingEnabled() && hasText(config.embeddingApiKey()));
        vo.setRagAvailable(config.ragEnabled() && state.embeddingModel() != null && config.embeddingEnabled() && hasText(config.embeddingApiKey()));
        vo.setRagIndexName("blog_rag_chunks");
        return vo;
    }

    private String firstValue(Map<String, String> values, String envKey, String springKey, String defaultValue) {
        String fromFile = values.get(envKey);
        if (fromFile != null) {
            return fromFile;
        }
        String fromEnv = fallback.apply(envKey);
        if (fromEnv != null) {
            return fromEnv;
        }
        String fromSpring = fallback.apply(springKey);
        return fromSpring != null ? fromSpring : defaultValue;
    }

    private static String readFromEnvironment(Environment environment, String key) {
        if (environment == null) {
            return null;
        }
        return environment.getProperty(key);
    }

    private static Path resolvePath(String envFilePath) {
        String path = hasText(envFilePath) ? envFilePath.trim() : ".env";
        return Path.of(path);
    }

    private static ParsedLine parseEnvLine(String line) {
        if (line == null) {
            return null;
        }
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return null;
        }
        if (trimmed.startsWith("export ")) {
            trimmed = trimmed.substring("export ".length()).trim();
        }
        int eq = trimmed.indexOf('=');
        if (eq <= 0) {
            return null;
        }
        String key = trimmed.substring(0, eq).trim();
        if (!key.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            return null;
        }
        String value = unquote(trimmed.substring(eq + 1).trim());
        return new ParsedLine(key, value);
    }

    private static String unquote(String raw) {
        if (raw.length() >= 2 && raw.startsWith("\"") && raw.endsWith("\"")) {
            return raw.substring(1, raw.length() - 1)
                    .replace("\\n", "\n")
                    .replace("\\\"", "\"")
                    .replace("\\\\", "\\");
        }
        if (raw.length() >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
            return raw.substring(1, raw.length() - 1);
        }
        int commentIndex = raw.indexOf(" #");
        return commentIndex >= 0 ? raw.substring(0, commentIndex).trim() : raw;
    }

    private static String formatEnvValue(String value) {
        String text = value != null ? value : "";
        if (text.matches("[A-Za-z0-9_./:@%+\\-]*")) {
            return text;
        }
        return "\"" + text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n") + "\"";
    }

    private static String maskApiKey(String apiKey) {
        if (!hasText(apiKey)) {
            return "";
        }
        String trimmed = apiKey.trim();
        if (trimmed.length() < 6) {
            return trimmed.substring(0, Math.min(2, trimmed.length())) + "***";
        }
        return trimmed.substring(0, 3) + "***" + trimmed.substring(trimmed.length() - 3);
    }

    private long getLastModifiedMillis() {
        try {
            return Files.isRegularFile(envFile) ? Files.getLastModifiedTime(envFile).toMillis() : -1L;
        } catch (IOException e) {
            return -1L;
        }
    }

    private static boolean parseBoolean(String value) {
        return "true".equalsIgnoreCase(value) || "1".equals(value) || "yes".equalsIgnoreCase(value);
    }

    private static double parseDouble(String value, double defaultValue) {
        try {
            return Double.parseDouble(value);
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static int parsePositiveInt(String value, int defaultValue) {
        try {
            int parsed = Integer.parseInt(value);
            return parsed > 0 ? parsed : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static double parseSimilarityThreshold(String value, double defaultValue) {
        try {
            double parsed = Double.parseDouble(value);
            return parsed >= 0d && parsed <= 1d ? parsed : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static int normalizeMaxTokens(Integer value, int currentValue, int defaultValue) {
        if (value == null) {
            return currentValue;
        }
        return value > 0 ? value : defaultValue;
    }

    private static double normalizeSimilarityThreshold(Double value, double currentValue, double defaultValue) {
        if (value == null) {
            return currentValue;
        }
        return value >= 0d && value <= 1d ? value : defaultValue;
    }

    private static String formatDouble(double value) {
        return BigDecimal.valueOf(value).stripTrailingZeros().toPlainString();
    }

    private static String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static String trimToDefault(String value, String defaultValue) {
        return hasText(value) ? value.trim() : defaultValue;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record ParsedLine(String key, String value) {
    }

    private record RuntimeState(OpenAiConfigSnapshot config, ChatClient chatClient, EmbeddingModel embeddingModel,
                                long lastModifiedMillis) {
    }

    private record OpenAiConfigSnapshot(
            boolean aiEnabled,
            String apiKey,
            String baseUrl,
            String model,
            String completionsPath,
            double temperature,
            int maxTokensChat,
            int maxTokensTitle,
            int maxTokensSummary,
            int maxTokensKeywords,
            int maxTokensPolish,
            boolean ragEnabled,
            int ragTopK,
            double ragSimilarityThreshold,
            boolean embeddingEnabled,
            String embeddingBaseUrl,
            String embeddingPath,
            String embeddingModel,
            String embeddingApiKey,
            int embeddingDimensions
    ) {
        String apiKeyHash() {
            return apiKey != null ? Integer.toHexString(apiKey.hashCode()) : "";
        }

        String embeddingApiKeyHash() {
            return embeddingApiKey != null ? Integer.toHexString(embeddingApiKey.hashCode()) : "";
        }
    }
}
