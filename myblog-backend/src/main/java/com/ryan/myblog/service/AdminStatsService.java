package com.ryan.myblog.service;

import com.ryan.myblog.dto.AdminStatsDTO;
import com.ryan.myblog.dto.DailyStatsDTO;

import java.time.LocalDate;
import java.util.List;

/**
 * 管理员统计服务接口
 */
public interface AdminStatsService {

    /**
     * 获取管理员统计数据
     */
    AdminStatsDTO getAdminStats();

    /**
     * 获取指定时间段的每日统计数据
     * @param startDate 开始日期
     * @param endDate 结束日期
     * @return 每日统计数据列表
     */
    List<DailyStatsDTO> getDailyStats(LocalDate startDate, LocalDate endDate);

    /**
     * 获取最近7天的统计数据
     */
    List<DailyStatsDTO> getWeeklyStats();

    /**
     * 获取最近30天的统计数据
     */
    List<DailyStatsDTO> getMonthlyStats();
}