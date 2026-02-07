package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.mapper.ReportMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.dto.ReportCreateDTO;
import com.ryan.myblog.model.dto.ReportReviewDTO;
import com.ryan.myblog.model.entity.Report;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.vo.ReportVO;
import com.ryan.myblog.service.NotificationService;
import com.ryan.myblog.service.ReportService;
import com.ryan.myblog.service.notification.NotificationMessage;
import com.ryan.myblog.common.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportMapper reportMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    public void createReport(Long reporterId, ReportCreateDTO dto) {
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setTargetType(dto.getTargetType());
        report.setTargetId(dto.getTargetId());
        report.setReason(dto.getReason());
        report.setDetail(dto.getDetail());
        report.setStatus(0);
        reportMapper.insert(report);
    }

    @Override
    public IPage<ReportVO> getReportPage(PageRequest pageRequest, Integer status, String targetType) {
        Page<Report> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        LambdaQueryWrapper<Report> wrapper = new LambdaQueryWrapper<>();
        if (status != null) {
            wrapper.eq(Report::getStatus, status);
        }
        if (targetType != null && !targetType.isBlank()) {
            wrapper.eq(Report::getTargetType, targetType);
        }
        wrapper.orderByDesc(Report::getCreateTime);
        IPage<Report> reportPage = reportMapper.selectPage(page, wrapper);
        List<Report> records = reportPage.getRecords();
        if (records.isEmpty()) {
            return reportPage.convert(r -> new ReportVO());
        }

        List<Long> userIds = records.stream()
                .flatMap(r -> java.util.stream.Stream.of(r.getReporterId(), r.getReviewerId()))
                .filter(id -> id != null && id > 0)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, User> userMap = userIds.isEmpty()
                ? Map.of()
                : userMapper.selectBatchIds(userIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));

        return reportPage.convert(report -> toVO(report, userMap));
    }

    @Override
    @Transactional
    public void reviewReport(Long reportId, Long reviewerId, ReportReviewDTO dto) {
        Report report = reportMapper.selectById(reportId);
        if (report == null) {
            throw new RuntimeException("举报不存在");
        }
        report.setStatus(dto.getStatus());
        report.setReviewerId(reviewerId);
        report.setReviewTime(LocalDateTime.now());
        report.setAction(dto.getAction());
        report.setNotes(dto.getNotes());
        reportMapper.updateById(report);

        // 通知举报人
        try {
            NotificationMessage message = NotificationMessage.builder()
                    .type(NotificationType.SYSTEM)
                    .receiverId(report.getReporterId())
                    .title("举报处理结果")
                    .content("您的举报已处理，状态：" + (dto.getStatus() == 1 ? "通过" : "拒绝"))
                    .resourceType(null)
                    .resourceId(report.getTargetId())
                    .build();
            notificationService.create(message);
            notificationService.incrementUnreadCount(report.getReporterId());
        } catch (Exception e) {
            log.warn("发送举报通知失败", e);
        }
    }

    private ReportVO toVO(Report report, Map<Long, User> userMap) {
        ReportVO vo = new ReportVO();
        vo.setId(report.getId());
        vo.setReporterId(report.getReporterId());
        vo.setTargetType(report.getTargetType());
        vo.setTargetId(report.getTargetId());
        vo.setReason(report.getReason());
        vo.setDetail(report.getDetail());
        vo.setStatus(report.getStatus());
        vo.setReviewerId(report.getReviewerId());
        vo.setReviewTime(report.getReviewTime());
        vo.setAction(report.getAction());
        vo.setNotes(report.getNotes());
        vo.setCreateTime(report.getCreateTime());

        User reporter = userMap.get(report.getReporterId());
        if (reporter != null) {
            vo.setReporterName(reporter.getNickname() != null ? reporter.getNickname() : reporter.getUsername());
        }
        if (report.getReviewerId() != null) {
            User reviewer = userMap.get(report.getReviewerId());
            if (reviewer != null) {
                vo.setReviewerName(reviewer.getNickname() != null ? reviewer.getNickname() : reviewer.getUsername());
            }
        }
        return vo;
    }
}
