package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.NotificationSettingDTO;
import com.ryan.myblog.model.entity.NotificationSetting;
import com.ryan.myblog.model.vo.NotificationVO;
import com.ryan.myblog.service.NotificationService;
import com.ryan.myblog.utils.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 通知控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "通知管理", description = "通知相关接口")
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * 获取通知列表
     */
    @GetMapping
    @Operation(summary = "获取通知列表", description = "分页获取当前用户的通知列表")
    public Result<IPage<NotificationVO>> getNotifications(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer isRead) {
        Long userId = SecurityUtils.getCurrentUserId();
        IPage<NotificationVO> notifications = notificationService.getNotificationPage(userId, type, isRead, page, size);
        return Result.success(notifications);
    }

    /**
     * 获取未读通知数量
     */
    @GetMapping("/unread/count")
    @Operation(summary = "获取未读通知数量")
    public Result<Long> getUnreadCount() {
        Long userId = SecurityUtils.getCurrentUserId();
        Long count = notificationService.getUnreadCount(userId);
        return Result.success(count);
    }

    /**
     * 按类型获取未读通知数量
     */
    @GetMapping("/unread/count/by-type")
    @Operation(summary = "按类型获取未读通知数量")
    public Result<Map<String, Long>> getUnreadCountByType() {
        Long userId = SecurityUtils.getCurrentUserId();
        Map<String, Long> counts = notificationService.getUnreadCountByType(userId);
        return Result.success(counts);
    }

    /**
     * 标记单个通知为已读
     */
    @PutMapping("/{id}/read")
    @Operation(summary = "标记通知为已读")
    public Result<Void> markAsRead(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean success = notificationService.markAsRead(userId, id);
        return success ? Result.success() : Result.error("标记失败");
    }

    /**
     * 标记所有通知为已读
     */
    @PutMapping("/read-all")
    @Operation(summary = "标记所有通知为已读")
    public Result<Void> markAllAsRead() {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return Result.success();
    }

    /**
     * 按类型标记通知为已读
     */
    @PutMapping("/read-all/{type}")
    @Operation(summary = "按类型标记通知为已读")
    public Result<Void> markAsReadByType(@PathVariable String type) {
        Long userId = SecurityUtils.getCurrentUserId();
        notificationService.markAsReadByType(userId, type);
        return Result.success();
    }

    /**
     * 删除通知
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除通知")
    public Result<Void> deleteNotification(@PathVariable Long id) {
        Long userId = SecurityUtils.getCurrentUserId();
        boolean success = notificationService.deleteNotification(userId, id);
        return success ? Result.success() : Result.error("删除失败");
    }

    /**
     * 获取通知设置
     */
    @GetMapping("/settings")
    @Operation(summary = "获取通知设置")
    public Result<NotificationSetting> getSettings() {
        Long userId = SecurityUtils.getCurrentUserId();
        NotificationSetting setting = notificationService.getUserSetting(userId);
        return Result.success(setting);
    }

    /**
     * 更新通知设置
     */
    @PutMapping("/settings")
    @Operation(summary = "更新通知设置")
    public Result<Void> updateSettings(@RequestBody NotificationSettingDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        NotificationSetting setting = new NotificationSetting();
        BeanUtils.copyProperties(dto, setting);
        boolean success = notificationService.updateUserSetting(userId, setting);
        return success ? Result.success() : Result.error("更新失败");
    }
}
