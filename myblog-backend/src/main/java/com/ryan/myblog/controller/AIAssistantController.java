package com.ryan.myblog.controller;

import com.ryan.myblog.annotation.RateLimit;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.service.AIAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
}
