package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
     * 搜索博客
     */
    @GetMapping("/blogs")
    public Result<Page<BlogDocument>> searchBlogs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<BlogDocument> result = searchService.searchBlogs(keyword, pageable);
        
        return Result.success(result);
    }
    
    /**
     * 高级搜索
     */
    @GetMapping("/blogs/advanced")
    public Result<Page<BlogDocument>> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<BlogDocument> result = searchService.advancedSearch(keyword, categoryId, tags, pageable);
        
        return Result.success(result);
    }
    
    /**
     * 获取搜索建议
     */
    @GetMapping("/suggestions")
    public Result<List<String>> getSuggestions(@RequestParam String prefix) {
        List<String> suggestions = searchService.getSuggestions(prefix);
        return Result.success(suggestions);
    }
    
    /**
     * 重建索引（管理员功能）
     */
    @PostMapping("/rebuild-index")
    public Result<Void> rebuildIndex() {
        searchService.rebuildIndex();
        return Result.success();
    }
    
    /**
     * 检查搜索服务状态
     */
    @GetMapping("/status")
    public Result<Boolean> getSearchStatus() {
        boolean isAvailable = searchService.isAvailable();
        return Result.success(isAvailable);
    }
}