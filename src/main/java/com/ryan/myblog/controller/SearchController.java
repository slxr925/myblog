package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.dto.SearchRequestDTO;
import com.ryan.myblog.service.SearchService;
import com.ryan.myblog.vo.SearchResultVO;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 搜索控制器
 */
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    
    private final SearchService searchService;
    
    /**
     * 高级搜索
     */
    @PostMapping
    public Result<Page<SearchResultVO>> search(@RequestBody SearchRequestDTO searchRequest) {
        try {
            Page<SearchResultVO> result = searchService.searchBlogs(searchRequest);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("搜索失败: " + e.getMessage());
        }
    }
    
    /**
     * 简单关键词搜索
     */
    @GetMapping
    public Result<Page<SearchResultVO>> searchByKeyword(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        try {
            Page<SearchResultVO> result = searchService.searchByKeyword(keyword, page, size);
            return Result.success(result);
        } catch (Exception e) {
            return Result.error("搜索失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取热门搜索词
     */
    @GetMapping("/hot")
    public Result<List<String>> getHotSearchKeywords(@RequestParam(defaultValue = "10") Integer limit) {
        List<String> hotKeywords = searchService.getHotSearchKeywords(limit);
        return Result.success(hotKeywords);
    }
    
    /**
     * 获取搜索建议
     */
    @GetMapping("/suggest")
    public Result<List<String>> getSearchSuggestions(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "5") Integer limit) {
        List<String> suggestions = searchService.getSearchSuggestions(keyword, limit);
        return Result.success(suggestions);
    }
    
    /**
     * 同步博客到ES（管理员功能）
     */
    @PostMapping("/sync/{blogId}")
    public Result<Void> syncBlog(@PathVariable Long blogId) {
        try {
            searchService.syncBlogToEs(blogId);
            return Result.success();
        } catch (Exception e) {
            return Result.error("同步失败: " + e.getMessage());
        }
    }
    
    /**
     * 批量同步所有博客到ES（管理员功能）
     */
    @PostMapping("/sync/all")
    public Result<Void> syncAllBlogs() {
        try {
            searchService.syncAllBlogsToEs();
            return Result.success();
        } catch (Exception e) {
            return Result.error("批量同步失败: " + e.getMessage());
        }
    }
    
    /**
     * 重建搜索索引（管理员功能）
     */
    @PostMapping("/rebuild")
    public Result<Void> rebuildIndex() {
        try {
            searchService.rebuildIndex();
            return Result.success();
        } catch (Exception e) {
            return Result.error("重建索引失败: " + e.getMessage());
        }
    }
}