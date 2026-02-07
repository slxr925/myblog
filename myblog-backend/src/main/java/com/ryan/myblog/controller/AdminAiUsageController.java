package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.vo.AiUsageDailyVO;
import com.ryan.myblog.model.vo.AiUsageUserVO;
import com.ryan.myblog.service.AiUsageService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ai-usage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAiUsageController {

    private final AiUsageService aiUsageService;

    @GetMapping("/daily")
    public Result<List<AiUsageDailyVO>> getDailyUsage(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "7") Integer days) {
        Long targetUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        return Result.success(aiUsageService.getDailyUsage(targetUserId, days));
    }

    @GetMapping("/top-users")
    public Result<List<AiUsageUserVO>> getTopUsers(
            @RequestParam(defaultValue = "7") Integer days,
            @RequestParam(defaultValue = "10") Integer limit) {
        return Result.success(aiUsageService.getTopUsers(days, limit));
    }
}
