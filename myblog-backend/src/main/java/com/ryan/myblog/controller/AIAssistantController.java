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
import org.springframework.web.bind.annotation.*;

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

    /**
     * AI聊天接口
     */
    @Operation(summary = "AI聊天", description = "与AI助手进行对话")
    @PostMapping("/chat")
    @RateLimit(key = "ai_chat", limit = 20, window = 60)
    public Result<AIChatResponse> chat(@RequestBody AIChatRequest request) {
        log.info("AI聊天请求: {}", request.getQuestion());
        AIChatResponse response = aiAssistantService.chat(request);
        return Result.success(response);
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
        String title = aiAssistantService.generateTitle(request.getContent());
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
        String polished = aiAssistantService.polishContent(request.getContent());
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
        String summary = aiAssistantService.generateSummary(request.getContent());
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
        java.util.List<String> keywords = aiAssistantService.extractKeywords(request.getContent());
        return Result.success(new AIKeywordsResponse(keywords));
    }
}
