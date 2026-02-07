package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.service.UserBlockService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/block")
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @PostMapping("/{blockedId}")
    public Result<Void> blockUser(@PathVariable Long blockedId) {
        Long userId = SecurityUtils.getCurrentUserId();
        userBlockService.blockUser(userId, blockedId);
        return Result.success();
    }

    @DeleteMapping("/{blockedId}")
    public Result<Void> unblockUser(@PathVariable Long blockedId) {
        Long userId = SecurityUtils.getCurrentUserId();
        userBlockService.unblockUser(userId, blockedId);
        return Result.success();
    }

    @GetMapping("/list")
    public Result<List<Long>> getBlockedUsers() {
        Long userId = SecurityUtils.getCurrentUserId();
        return Result.success(userBlockService.getBlockedUserIds(userId));
    }
}
