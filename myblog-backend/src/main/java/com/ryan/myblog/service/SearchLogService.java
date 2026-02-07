package com.ryan.myblog.service;

import com.ryan.myblog.model.vo.SearchTrendVO;

import java.util.List;

/**
 * 搜索日志服务
 */
public interface SearchLogService {

    void recordSearch(Long userId, String keyword, String filtersJson, int resultCount);

    List<SearchTrendVO> getTrending(int days, int limit);
}
