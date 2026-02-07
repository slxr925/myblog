package com.ryan.myblog.controller;

import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.entity.AuditLog;
import com.ryan.myblog.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AuditLogService auditLogService;

    @GetMapping
    public Result<com.baomidou.mybatisplus.core.metadata.IPage<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long operatorId,
            @RequestParam(required = false) String action) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        return Result.success(auditLogService.getAuditLogs(pageRequest, operatorId, action));
    }
}
