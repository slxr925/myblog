package com.ryan.myblog.controller;

import com.ryan.myblog.annotation.RateLimit;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.exception.AiServiceUnavailableException;
import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.model.dto.AIContentRequest;
import com.ryan.myblog.model.dto.AIKeywordsResponse;
import com.ryan.myblog.model.dto.AIPolishResponse;
import com.ryan.myblog.model.dto.AISummaryResponse;
import com.ryan.myblog.model.dto.AITitleResponse;
import com.ryan.myblog.model.vo.AiQuotaVO;
import com.ryan.myblog.service.AIAssistantService;
import com.ryan.myblog.service.AiAction;
import com.ryan.myblog.service.AiQuotaReservation;
import com.ryan.myblog.service.AiStreamLifecycle;
import com.ryan.myblog.service.AiUsageService;
import com.ryan.myblog.utils.SecurityUtils;
import com.ryan.myblog.utils.UserRoleUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.function.Predicate;
import java.util.function.Supplier;

@Slf4j
@Tag(name = "AI助手", description = "AI智能问答助手接口")
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIAssistantController {

    private static final String REQUEST_ID_HEADER = "X-AI-Request-Id";

    private final AIAssistantService aiAssistantService;
    private final AiUsageService aiUsageService;

    @Operation(summary = "AI聊天", description = "与AI助手进行对话")
    @PostMapping("/chat")
    @RateLimit(key = "ai_chat", limit = 20, window = 60)
    public Result<AIChatResponse> chat(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        log.info("AI聊天请求");
        int tokens = estimateTokens(request.getQuestion(), request.getHistory());
        AIChatResponse response = executeWithQuota(requestId, AiAction.CHAT, tokens,
                () -> aiAssistantService.chat(request),
                value -> value != null && value.getAnswer() != null && !value.getAnswer().isBlank());
        return Result.success(response);
    }

    @Operation(summary = "AI聊天（流式）", description = "与AI助手进行对话，使用SSE逐段返回")
    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @RateLimit(key = "ai_chat_stream", limit = 20, window = 60)
    public SseEmitter streamChat(
            @RequestBody AIChatRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        log.info("AI聊天流式请求");
        AiQuotaReservation reservation = reserve(
                requestId, AiAction.CHAT, estimateTokens(request.getQuestion(), request.getHistory()));
        AiStreamLifecycle lifecycle = new AiStreamLifecycle() {
            @Override
            public void onSuccess() {
                aiUsageService.confirm(reservation.requestId());
            }

            @Override
            public void onServiceFailure() {
                aiUsageService.refund(reservation.requestId());
            }
        };
        try {
            return aiAssistantService.streamChat(request, lifecycle);
        } catch (RuntimeException e) {
            aiUsageService.refund(reservation.requestId());
            throw new AiServiceUnavailableException(e);
        }
    }

    @Operation(summary = "获取AI助手介绍")
    @GetMapping("/introduction")
    public Result<String> getIntroduction() {
        return Result.success(aiAssistantService.getIntroduction());
    }

    @Operation(summary = "获取当前用户AI额度")
    @GetMapping("/quota")
    public Result<AiQuotaVO> getQuota() {
        return Result.success(aiUsageService.getQuota(
                SecurityUtils.getCurrentUserId(), UserRoleUtils.isAdmin()));
    }

    @Operation(summary = "生成文章标题", description = "根据文章内容自动生成吸引人的标题")
    @PostMapping("/generate-title")
    @RateLimit(key = "ai_title", limit = 10, window = 60)
    public Result<AITitleResponse> generateTitle(
            @Valid @RequestBody AIContentRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        String title = executeWithQuota(requestId, AiAction.TITLE, estimateTokens(request.getContent(), null),
                () -> aiAssistantService.generateTitle(request.getContent(), request.getStyle()),
                value -> value != null && !value.isBlank());
        return Result.success(new AITitleResponse(title));
    }

    @Operation(summary = "润色文章内容", description = "优化文章表达，修正语法错误")
    @PostMapping("/polish-content")
    @RateLimit(key = "ai_polish", limit = 5, window = 60)
    public Result<AIPolishResponse> polishContent(
            @Valid @RequestBody AIContentRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        String polished = executeWithQuota(requestId, AiAction.POLISH, estimateTokens(request.getContent(), null),
                () -> aiAssistantService.polishContent(request.getContent(), request.getStyle()),
                value -> value != null && !value.isBlank());
        return Result.success(new AIPolishResponse(polished));
    }

    @Operation(summary = "生成文章摘要", description = "自动生成文章摘要")
    @PostMapping("/generate-summary")
    @RateLimit(key = "ai_summary", limit = 20, window = 60)
    public Result<AISummaryResponse> generateSummary(
            @Valid @RequestBody AIContentRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        String summary = executeWithQuota(requestId, AiAction.SUMMARY, estimateTokens(request.getContent(), null),
                () -> aiAssistantService.generateSummary(request.getContent(), request.getStyle()),
                value -> value != null && !value.isBlank());
        return Result.success(new AISummaryResponse(summary));
    }

    @Operation(summary = "提取文章关键词", description = "自动提取文章关键词")
    @PostMapping("/extract-keywords")
    @RateLimit(key = "ai_keywords", limit = 20, window = 60)
    public Result<AIKeywordsResponse> extractKeywords(
            @Valid @RequestBody AIContentRequest request,
            @RequestHeader(value = REQUEST_ID_HEADER, required = false) String requestId) {
        List<String> keywords = executeWithQuota(requestId, AiAction.KEYWORDS,
                estimateTokens(request.getContent(), null),
                () -> aiAssistantService.extractKeywords(request.getContent(), request.getStyle()),
                value -> value != null && !value.isEmpty());
        return Result.success(new AIKeywordsResponse(keywords));
    }

    private AiQuotaReservation reserve(String requestId, AiAction action, int estimatedTokens) {
        return aiUsageService.reserve(requestId, SecurityUtils.getCurrentUserId(), action,
                estimatedTokens, UserRoleUtils.isAdmin());
    }

    private <T> T executeWithQuota(String requestId, AiAction action, int estimatedTokens,
                                   Supplier<T> operation, Predicate<T> validResult) {
        AiQuotaReservation reservation = reserve(requestId, action, estimatedTokens);
        try {
            T result = operation.get();
            if (!validResult.test(result)) {
                throw new IllegalStateException("AI 返回内容为空");
            }
            aiUsageService.confirm(reservation.requestId());
            return result;
        } catch (RuntimeException e) {
            aiUsageService.refund(reservation.requestId());
            throw new AiServiceUnavailableException(e);
        }
    }

    private int estimateTokens(String content, List<AIChatRequest.ChatMessage> history) {
        int length = content == null ? 0 : content.length();
        if (history != null) {
            length += history.stream()
                    .mapToInt(message -> message.getContent() == null ? 0 : message.getContent().length())
                    .sum();
        }
        return Math.max(1, length / 4);
    }
}
