package com.ryan.myblog.service;

import com.ryan.myblog.document.BlogDocument;
import com.ryan.myblog.dto.SearchRequestDTO;
import com.ryan.myblog.vo.SearchResultVO;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 搜索服务接口
 */
public interface SearchService {
    
    /**
     * 搜索博客
     */
    Page<SearchResultVO> searchBlogs(SearchRequestDTO searchRequest);
    
    /**
     * 简单关键词搜索
     */
    Page<SearchResultVO> searchByKeyword(String keyword, Integer page, Integer size);
    
    /**
     * 获取热门搜索词
     */
    List<String> getHotSearchKeywords(Integer limit);
    
    /**
     * 获取搜索建议
     */
    List<String> getSearchSuggestions(String keyword, Integer limit);
    
    /**
     * 同步博客到Elasticsearch
     */
    void syncBlogToEs(Long blogId);
    
    /**
     * 从Elasticsearch删除博客
     */
    void deleteBlogFromEs(Long blogId);
    
    /**
     * 批量同步所有博客到Elasticsearch
     */
    void syncAllBlogsToEs();
    
    /**
     * 重建索引
     */
    void rebuildIndex();
}