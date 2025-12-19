package com.ryan.myblog.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI配置类
 * 手动配置OpenAiChatModel，因为禁用了自动配置
 */
@Slf4j
@Configuration
public class AIConfig {

    @Value("${spring.ai.enabled:false}")
    private boolean aiEnabled;

    @Value("${spring.ai.openai.api-key:}")
    private String apiKey;

    @Value("${spring.ai.openai.base-url:https://api.openai.com}")
    private String baseUrl;

    @Value("${spring.ai.openai.chat.options.model:gpt-3.5-turbo}")
    private String model;

    @Value("${spring.ai.openai.chat.options.temperature:0.7}")
    private Double temperature;

    @PostConstruct
    public void logConfig() {
        log.info("AI配置状态: enabled={}, apiKey长度={}, baseUrl={}, model={}",
                aiEnabled,
                apiKey != null ? apiKey.length() : 0,
                baseUrl,
                model);
    }

    /**
     * 创建OpenAiChatModel Bean
     * 使用程序化条件判断替代@ConditionalOnProperty
     */
    @Bean
    public OpenAiChatModel openAiChatModel() {
        if (!aiEnabled) {
            log.info("AI功能未启用 (spring.ai.enabled=false)，跳过OpenAiChatModel创建");
            return null;
        }

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("AI功能已启用但未配置API Key，OpenAiChatModel将不会被创建");
            return null;
        }

        log.info("正在初始化OpenAiChatModel，模型: {}, Base URL: {}", model, baseUrl);

        // 创建OpenAI API客户端
        OpenAiApi openAiApi = new OpenAiApi(baseUrl, apiKey);

        // 创建ChatModel配置
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .withModel(model)
                .withTemperature(temperature)
                .build();

        // 创建ChatModel
        OpenAiChatModel chatModel = new OpenAiChatModel(openAiApi, options);

        log.info("OpenAiChatModel初始化成功");
        return chatModel;
    }
}
