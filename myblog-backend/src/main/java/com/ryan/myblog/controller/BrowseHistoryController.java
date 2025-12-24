package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.vo.BrowseHistoryVO;
import com.ryan.myblog.service.BrowseHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 浏览记录控制器
 */
@RestController
@RequestMapping("/api/browse-history")
@RequiredArgsConstructor
public class BrowseHistoryController {

    private final BrowseHistoryService browseHistoryService;

    /**
     * 获取用户浏览记录
     * 
     * @param days 查询最近几天的记录（默认3天）
     * @return 浏览记录列表
     */
    @GetMapping
    public Result<List<BrowseHistoryVO>> getUserBrowseHistory(
            @RequestParam(defaultValue = "3") Integer days) {
        Long userId = getCurrentUserId();
        List<BrowseHistoryVO> history = browseHistoryService.getUserBrowseHistory(userId, days);
        return Result.success(history);
    }

    /**
     * 获取当前用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new RuntimeException("用户未登录");
    }
}
