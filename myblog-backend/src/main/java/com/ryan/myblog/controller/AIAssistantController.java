package com.ryan.myblog.controller;

import com.ryan.myblog.annotation.RateLimit;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.*;
import com.ryan.myblog.service.AIAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;

/**
 * AI助手控制器
 */
@Slf4j
@Tag(name = "AI助手", description = "AI智能问答助手接口")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIAssistantController {

    private final AIAssistantService aiAssistantService;
    private final com.ryan.myblog.service.AiUsageService aiUsageService;

    @org.springframework.beans.factory.annotation.Value("${app.ai.quota.max-requests-per-day:50}")
    private int maxRequestsPerDay;

    @org.springframework.beans.factory.annotation.Value("${app.ai.quota.max-tokens-per-day:50000}")
    private int maxTokensPerDay;

    /**
     * AI聊天接口
     */
    @Operation(summary = "AI聊天", description = "与AI助手进行对话")
    @PostMapping("/chat")
    @RateLimit(key = "ai_chat", limit = 20, window = 60)
    public Result<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        log.info("AI聊天请求: {}", request.getQuestion());
        if (!checkQuota(request.getQuestion(), request.getHistory())) {
            return Result.error(429, "AI使用额度已达上限，请稍后再试");
        }
        AIChatResponse response = aiAssistantService.chat(request);
        return Result.success(response);
    }

    /**
     * AI聊天流式接口
     */
    @Operation(summary = "AI聊天（流式）", description = "与AI助手进行对话，使用SSE逐段返回")
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @RateLimit(key = "ai_chat_stream", limit = 20, window = 60)
    public SseEmitter streamChat(@RequestBody AIChatRequest request) {
        log.info("AI聊天流式请求: {}", request.getQuestion());
        if (!checkQuota(request.getQuestion(), request.getHistory())) {
            return quotaExceededEmitter();
        }
        return aiAssistantService.streamChat(request);
    }

    /**
     * 获取AI助手介绍
     */
    @Operation(summary = "获取AI助手介绍")
    @GetMapping("/introduction")
    public Result<String> getIntroduction() {
        String intro = aiAssistantService.getIntroduction();
        return Result.success(intro);
    }

    /**
     * 生成文章标题
     */
    @Operation(summary = "生成文章标题", description = "根据文章内容自动生成吸引人的标题")
    @PostMapping("/generate-title")
    @RateLimit(key = "ai_title", limit = 10, window = 60)
    public Result<AITitleResponse> generateTitle(@Valid @RequestBody AIContentRequest request) {
        log.info("AI生成标题请求，内容长度: {}", request.getContent().length());
        if (!checkQuota(request.getContent(), null)) {
            return Result.error(429, "AI使用额度已达上限，请稍后再试");
        }
        String title = aiAssistantService.generateTitle(request.getContent(), request.getStyle());
        return Result.success(new AITitleResponse(title));
    }

    /**
     * 润色文章内容
     */
    @Operation(summary = "润色文章内容", description = "优化文章表达，修正语法错误")
    @PostMapping("/polish-content")
    @RateLimit(key = "ai_polish", limit = 5, window = 60)
    public Result<AIPolishResponse> polishContent(@Valid @RequestBody AIContentRequest request) {
        log.info("AI润色请求，内容长度: {}", request.getContent().length());
        if (!checkQuota(request.getContent(), null)) {
            return Result.error(429, "AI使用额度已达上限，请稍后再试");
        }
        String polished = aiAssistantService.polishContent(request.getContent(), request.getStyle());
        return Result.success(new AIPolishResponse(polished));
    }

    /**
     * 生成文章摘要
     */
    @Operation(summary = "生成文章摘要", description = "自动生成文章摘要")
    @PostMapping("/generate-summary")
    @RateLimit(key = "ai_summary", limit = 20, window = 60)
    public Result<AISummaryResponse> generateSummary(@Valid @RequestBody AIContentRequest request) {
        log.info("AI生成摘要请求，内容长度: {}", request.getContent().length());
        if (!checkQuota(request.getContent(), null)) {
            return Result.error(429, "AI使用额度已达上限，请稍后再试");
        }
        String summary = aiAssistantService.generateSummary(request.getContent(), request.getStyle());
        return Result.success(new AISummaryResponse(summary));
    }

    /**
     * 提取文章关键词
     */
    @Operation(summary = "提取文章关键词", description = "自动提取文章关键词")
    @PostMapping("/extract-keywords")
    @RateLimit(key = "ai_keywords", limit = 20, window = 60)
    public Result<AIKeywordsResponse> extractKeywords(@Valid @RequestBody AIContentRequest request) {
        log.info("AI提取关键词请求，内容长度: {}", request.getContent().length());
        if (!checkQuota(request.getContent(), null)) {
            return Result.error(429, "AI使用额度已达上限，请稍后再试");
        }
        java.util.List<String> keywords = aiAssistantService.extractKeywords(request.getContent(), request.getStyle());
        return Result.success(new AIKeywordsResponse(keywords));
    }

    private boolean checkQuota(String content, java.util.List<AIChatRequest.ChatMessage> history) {
        Long userId = com.ryan.myblog.utils.SecurityUtils.getCurrentUserId();
        int length = content != null ? content.length() : 0;
        if (history != null) {
            length += history.stream().mapToInt(msg -> msg.getContent() != null ? msg.getContent().length() : 0).sum();
        }
        int estimatedTokens = Math.max(1, length / 4);
        return aiUsageService.checkAndConsume(userId, estimatedTokens, maxRequestsPerDay, maxTokensPerDay);
    }

    private SseEmitter quotaExceededEmitter() {
        SseEmitter emitter = new SseEmitter(5_000L);
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(Map.of("message", "AI使用额度已达上限，请稍后再试")));
            emitter.complete();
        } catch (IOException e) {
            emitter.completeWithError(e);
        }
        return emitter;
    }
}
