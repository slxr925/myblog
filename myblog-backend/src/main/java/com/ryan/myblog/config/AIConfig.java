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
 * 手动配置OpenAiChatModel，支持自定义API路径以兼容不同AI服务提供商
 * 
 * 配置说明:
 * - spring.ai.openai.base-url: API基础地址
 * - spring.ai.openai.api-key: API密钥
 * - spring.ai.openai.chat.completions-path:
 * 自定义completions路径（默认/v1/chat/completions）
 * - spring.ai.openai.chat.options.model: 模型名称
 * 
 * 常见配置:
 * - OpenAI: base-url=https://api.openai.com, 使用默认路径
 * - ChatAnywhere: base-url=https://api.chatanywhere.tech, 使用默认路径
 * - 智谱GLM: base-url=https://open.bigmodel.cn/api/paas/v4,
 * completions-path=/chat/completions
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

    @Value("${spring.ai.openai.chat.completions-path:/v1/chat/completions}")
    private String completionsPath;

    @PostConstruct
    public void logConfig() {
        log.info("AI配置状态: enabled={}, apiKey长度={}, baseUrl={}, model={}, completionsPath={}",
                aiEnabled,
                apiKey != null ? apiKey.length() : 0,
                baseUrl,
                model,
                completionsPath);
    }

    /**
     * 创建OpenAiChatModel Bean
     * 支持通过配置自定义API路径，兼容不同AI服务商
     */
    @Bean
    public OpenAiChatModel openAiChatModel() {
        log.info("检查AI配置: enabled={}, apiKey长度={}, baseUrl={}, model={}, completionsPath={}",
                aiEnabled, apiKey != null ? apiKey.length() : 0, baseUrl, model, completionsPath);

        if (apiKey == null || apiKey.isEmpty()) {
            log.info("未配置API Key，跳过OpenAiChatModel创建");
            return null;
        }

        try {
            log.info("正在初始化OpenAiChatModel，模型: {}, Base URL: {}, Path: {}", model, baseUrl, completionsPath);

            // 使用Builder创建OpenAI API客户端，支持自定义completions路径
            OpenAiApi openAiApi = OpenAiApi.builder()
                    .baseUrl(baseUrl)
                    .apiKey(apiKey)
                    .completionsPath(completionsPath)
                    .build();

            // 创建ChatModel配置
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .model(model)
                    .temperature(temperature)
                    .build();

            // 使用Builder创建ChatModel (Spring AI 1.1.x)
            OpenAiChatModel chatModel = OpenAiChatModel.builder()
                    .openAiApi(openAiApi)
                    .defaultOptions(options)
                    .build();

            log.info("OpenAiChatModel初始化成功");
            return chatModel;
        } catch (Exception e) {
            log.error("OpenAiChatModel初始化失败: {}", e.getMessage(), e);
            return null;
        }
    }
}
