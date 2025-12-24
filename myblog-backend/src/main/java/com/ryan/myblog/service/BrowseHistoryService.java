package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.BrowseHistoryVO;

import java.util.List;

/**
 * 浏览记录服务接口
 */
public interface BrowseHistoryService {

    /**
     * 记录用户浏览文章
     * 如果已存在记录，则更新浏览时间
     * 
     * @param userId 用户ID
     * @param blogId 文章ID
     */
    void recordBrowse(Long userId, Long blogId);

    /**
     * 获取用户的浏览记录
     * 
     * @param userId 用户ID
     * @param days   查询最近几天的记录（默认3天）
     * @return 浏览记录列表，按浏览时间倒序排列
     */
    List<BrowseHistoryVO> getUserBrowseHistory(Long userId, Integer days);

    /**
     * 清理过期的浏览记录
     * 
     * @param days 保留最近几天的记录
     * @return 删除的记录数
     */
    int cleanExpiredHistory(Integer days);
}
