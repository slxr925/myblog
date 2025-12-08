package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.SearchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 搜索控制器
 * 支持ES搜索，ES不可用时自动降级到MySQL搜索
 */
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {
    
    private final SearchService searchService;
    private final BlogService blogService;
    
    /**
     * 搜索博客
     * ES可用时使用ES搜索，否则降级到MySQL搜索
     */
    @GetMapping("/blogs")
    public Result<?> searchBlogs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // 检查ES是否可用
        if (searchService.isAvailable()) {
            try {
                Pageable pageable = PageRequest.of(page, size);
                Page<BlogDocument> result = searchService.searchBlogs(keyword, pageable);
                if (result.getTotalElements() > 0) {
                    log.debug("使用ES搜索 - 关键词: '{}', 结果数: {}", keyword, result.getTotalElements());
                    return Result.success(result);
                }
            } catch (Exception e) {
                log.warn("ES搜索失败，降级到MySQL搜索: {}", e.getMessage());
            }
        }
        
        // ES不可用或搜索失败，降级到MySQL搜索
        log.debug("使用MySQL搜索 - 关键词: '{}'", keyword);
        int mysqlLimit = page * size + size; // 计算需要的最大数量
        List<BlogListVO> mysqlResults = blogService.searchBlogs(keyword, mysqlLimit);
        
        // 手动分页
        int fromIndex = Math.min(page * size, mysqlResults.size());
        int toIndex = Math.min(fromIndex + size, mysqlResults.size());
        List<BlogListVO> pagedResults = mysqlResults.subList(fromIndex, toIndex);
        
        // 返回结果（包装成分页格式）
        Pageable pageable = PageRequest.of(page, size);
        Page<BlogListVO> resultPage = new PageImpl<>(pagedResults, pageable, mysqlResults.size());
        return Result.success(resultPage);
    }
    
    /**
     * 高级搜索
     */
    @GetMapping("/blogs/advanced")
    public Result<?> advancedSearch(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // 检查ES是否可用
        if (searchService.isAvailable()) {
            try {
                Pageable pageable = PageRequest.of(page, size);
                Page<BlogDocument> result = searchService.advancedSearch(keyword, categoryId, tags, pageable);
                if (result.getTotalElements() > 0) {
                    return Result.success(result);
                }
            } catch (Exception e) {
                log.warn("ES高级搜索失败，降级到MySQL搜索: {}", e.getMessage());
            }
        }
        
        // 降级到MySQL搜索
        if (keyword != null && !keyword.trim().isEmpty()) {
            int mysqlLimit = page * size + size;
            List<BlogListVO> mysqlResults = blogService.searchBlogs(keyword, mysqlLimit);
            
            // 手动分页
            int fromIndex = Math.min(page * size, mysqlResults.size());
            int toIndex = Math.min(fromIndex + size, mysqlResults.size());
            List<BlogListVO> pagedResults = mysqlResults.subList(fromIndex, toIndex);
            
            Pageable pageable = PageRequest.of(page, size);
            Page<BlogListVO> resultPage = new PageImpl<>(pagedResults, pageable, mysqlResults.size());
            return Result.success(resultPage);
        }
        
        return Result.success(Page.empty());
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