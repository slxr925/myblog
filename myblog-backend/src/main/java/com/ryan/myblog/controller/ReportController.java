package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.ReportCreateDTO;
import com.ryan.myblog.service.ReportService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public Result<Void> createReport(@Validated @RequestBody ReportCreateDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        reportService.createReport(userId, dto);
        return Result.success();
    }
}
