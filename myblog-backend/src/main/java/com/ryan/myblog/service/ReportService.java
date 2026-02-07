package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.ReportCreateDTO;
import com.ryan.myblog.model.dto.ReportReviewDTO;
import com.ryan.myblog.model.vo.ReportVO;

/**
 * 举报服务
 */
public interface ReportService {

    void createReport(Long reporterId, ReportCreateDTO dto);

    IPage<ReportVO> getReportPage(PageRequest pageRequest, Integer status, String targetType);

    void reviewReport(Long reportId, Long reviewerId, ReportReviewDTO dto);
}
