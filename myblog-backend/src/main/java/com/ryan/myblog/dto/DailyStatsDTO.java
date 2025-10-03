package com.ryan.myblog.dto;

import lombok.Data;

/**
 * 每日统计数据DTO
 */
@Data
public class DailyStatsDTO {

    /**
     * 日期（格式：yyyy-MM-dd）
     */
    private String date;

    /**
     * 新增用户数
     */
    private Long newUsers;

    /**
     * 新增文章数
     */
    private Long newBlogs;

    /**
     * 新增评论数
     */
    private Long newComments;

    /**
     * 总访问量
     */
    private Long totalViews;
}