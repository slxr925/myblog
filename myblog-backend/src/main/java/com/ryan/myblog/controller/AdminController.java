package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.dto.AdminStatsDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.entity.VisitLog;
import com.ryan.myblog.mapper.VisitLogMapper;
import com.ryan.myblog.service.AdminStatsService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.UserRoleUtils;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final UserService userService;
    private final AdminStatsService adminStatsService;
    private final VisitLogMapper visitLogMapper;

    /**
     * 获取管理员统计数据
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<AdminStatsDTO> getStats() {
        try {
            AdminStatsDTO stats = adminStatsService.getAdminStats();
            return Result.success("获取统计数据成功", stats);
        } catch (Exception e) {
            log.error("获取统计数据失败", e);
            return Result.error("获取统计数据失败: " + e.getMessage());
        }
    }

    /**
     * 获取所有用户列表（仅管理员）
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<List<User>> getAllUsers() {
        // 这里需要实现获取所有用户的逻辑
        // 暂时返回空列表，需要根据实际业务实现
        return Result.success("获取用户列表成功", null);
    }

    /**
     * 获取管理员仪表板数据
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Object> getDashboard() {
        // 返回管理员仪表板数据
        // 包括博客统计、用户统计等
        return Result.success("获取仪表板数据成功", null);
    }

    /**
     * 记录页面访问
     */
    @PostMapping("/track-visit")
    public Result<Void> trackVisit(@RequestBody Map<String, String> request, HttpServletRequest httpRequest) {
        try {
            String page = request.get("page");
            String ipAddress = getClientIpAddress(httpRequest);
            String userAgent = httpRequest.getHeader("User-Agent");

            // 获取当前用户ID（如果已登录）
            Long userId = null;
            try {
                userId = SecurityUtils.getCurrentUserId();
            } catch (Exception e) {
                // 用户未登录，userId保持为null
            }

            VisitLog visitLog = new VisitLog();
            visitLog.setPage(page);
            visitLog.setIpAddress(ipAddress);
            visitLog.setUserAgent(userAgent);
            visitLog.setUserId(userId);
            visitLog.setVisitTime(LocalDateTime.now());
            visitLog.setCreateTime(LocalDateTime.now());

            visitLogMapper.insert(visitLog);

            log.info("记录访问: page={}, ip={}, userId={}", page, ipAddress, userId);
            return Result.success();

        } catch (Exception e) {
            log.error("记录访问失败", e);
            return Result.error("记录访问失败");
        }
    }

    /**
     * 获取客户端真实IP地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }

    /**
     * 检查当前用户是否为管理员
     */
    @GetMapping("/check")
    public Result<Boolean> checkAdmin() {
        boolean isAdmin = UserRoleUtils.isAdmin();
        return Result.success("检查管理员权限成功", isAdmin);
    }
}