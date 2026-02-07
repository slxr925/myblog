package com.ryan.myblog.controller;

import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.ReportReviewDTO;
import com.ryan.myblog.model.vo.ReportVO;
import com.ryan.myblog.service.ReportService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping
    public Result<com.baomidou.mybatisplus.core.metadata.IPage<ReportVO>> listReports(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String targetType) {
        PageRequest pageRequest = new PageRequest();
        pageRequest.setPage(page);
        pageRequest.setSize(size);
        return Result.success(reportService.getReportPage(pageRequest, status, targetType));
    }

    @PostMapping("/{id}/review")
    @com.ryan.myblog.annotation.AuditLog(action = "REVIEW", resource = "REPORT")
    public Result<Void> reviewReport(@PathVariable Long id, @Validated @RequestBody ReportReviewDTO dto) {
        Long reviewerId = SecurityUtils.getCurrentUserId();
        reportService.reviewReport(id, reviewerId, dto);
        return Result.success();
    }
}
