package com.ryan.myblog.controller;

import com.ryan.myblog.ai.memory.AiConversationMemoryService;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.vo.AiConversationVO;
import com.ryan.myblog.model.vo.AiObservabilityStatsVO;
import com.ryan.myblog.model.vo.AiRequestLogVO;
import com.ryan.myblog.model.vo.AiToolCallVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/ai-observability")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiObservabilityController {

    private final AiObservabilityService observabilityService;
    private final AiConversationMemoryService memoryService;

    @GetMapping("/stats")
    public Result<AiObservabilityStatsVO> stats(@RequestParam(defaultValue = "7") int days) {
        return Result.success(observabilityService.getStats(days));
    }

    @GetMapping("/requests")
    public Result<PageResult<AiRequestLogVO>> requests(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return Result.success(observabilityService.listRequests(page, size, status));
    }

    @GetMapping("/conversations")
    public Result<PageResult<AiConversationVO>> conversations(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(memoryService.listAdminConversations(page, size));
    }

    @GetMapping("/tool-calls")
    public Result<PageResult<AiToolCallVO>> toolCalls(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return Result.success(observabilityService.listToolCalls(page, size, status));
    }

    @GetMapping("/errors")
    public Result<PageResult<AiRequestLogVO>> errors(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(observabilityService.listRequests(page, size, "error"));
    }
}
