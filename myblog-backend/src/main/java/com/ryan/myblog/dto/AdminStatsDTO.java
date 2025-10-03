package com.ryan.myblog.dto;

import lombok.Data;
import java.util.List;

/**
 * 管理员统计数据DTO
 */
@Data
public class AdminStatsDTO {

    /**
     * 总用户数
     */
    private Long totalUsers;

    /**
     * 总文章数
     */
    private Long totalBlogs;

    /**
     * 总评论数
     */
    private Long totalComments;

    /**
     * 总点赞数
     */
    private Long totalLikes;

    /**
     * 今日访问量
     */
    private Long todayViews;

    /**
     * 今日新增用户数
     */
    private Long todayNewUsers;

    /**
     * 今日新增文章数
     */
    private Long todayNewBlogs;

    /**
     * 今日新增评论数
     */
    private Long todayNewComments;

    /**
     * 最近7天的统计数据
     */
    private List<DailyStatsDTO> weeklyStats;

    /**
     * 最近30天的统计数据
     */
    private List<DailyStatsDTO> monthlyStats;
}