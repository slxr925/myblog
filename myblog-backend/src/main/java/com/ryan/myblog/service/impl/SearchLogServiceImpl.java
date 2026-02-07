package com.ryan.myblog.service.impl;

import com.ryan.myblog.mapper.SearchLogMapper;
import com.ryan.myblog.model.entity.SearchLog;
import com.ryan.myblog.model.vo.SearchTrendVO;
import com.ryan.myblog.service.SearchLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchLogServiceImpl implements SearchLogService {

    private final SearchLogMapper searchLogMapper;

    @Override
    public void recordSearch(Long userId, String keyword, String filtersJson, int resultCount) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        SearchLog log = new SearchLog();
        log.setUserId(userId);
        log.setKeyword(keyword.trim());
        log.setFiltersJson(filtersJson);
        log.setResultCount(resultCount);
        log.setCreateTime(LocalDateTime.now());
        searchLogMapper.insert(log);
    }

    @Override
    public List<SearchTrendVO> getTrending(int days, int limit) {
        return searchLogMapper.selectTrending(days, limit);
    }
}
