package com.ryan.myblog.controller;

import com.ryan.myblog.ai.memory.AiConversationMemoryService;
import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.vo.AiConversationVO;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/conversations")
@RequiredArgsConstructor
public class AiConversationController {

    private final AiConversationMemoryService memoryService;

    @GetMapping
    public Result<PageResult<AiConversationVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(memoryService.listUserConversations(userId, page, size));
    }

    @GetMapping("/{conversationId}")
    public Result<AiConversationVO> detail(@PathVariable String conversationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        AiConversationVO conversation = memoryService.getUserConversation(userId, conversationId);
        if (conversation == null) {
            return Result.error(404, "对话不存在");
        }
        return Result.success(conversation);
    }

    @DeleteMapping("/{conversationId}")
    public Result<Void> delete(@PathVariable String conversationId) {
        Long userId = SecurityUtils.getCurrentUserId();
        memoryService.deleteUserConversation(userId, conversationId);
        return Result.success(null);
    }
}
