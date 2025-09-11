package com.ryan.myblog;

import com.ryan.myblog.dto.SearchRequestDTO;
import com.ryan.myblog.service.SearchService;
import com.ryan.myblog.vo.SearchResultVO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;

import java.util.List;

@SpringBootTest
public class SearchServiceTest {

    @Autowired
    private SearchService searchService;

    @Test
    public void testSearchSystem() {
        System.out.println("=== Elasticsearch搜索系统功能测试 ===");
        
        try {
            // 1. 重建索引
            System.out.println("1. 重建Elasticsearch索引...");
            searchService.rebuildIndex();
            System.out.println("✅ 索引重建成功");
            
            // 等待索引刷新
            Thread.sleep(2000);
            
            // 2. 批量同步博客到ES
            System.out.println("\n2. 批量同步博客到ES...");
            searchService.syncAllBlogsToEs();
            System.out.println("✅ 博客批量同步成功");
            
            // 等待索引刷新
            Thread.sleep(2000);
            
            // 3. 简单关键词搜索
            System.out.println("\n3. 测试简单关键词搜索...");
            Page<SearchResultVO> searchResults = searchService.searchByKeyword("Spring", 1, 5);
            System.out.println("✅ 关键词'Spring'搜索成功，共找到 " + searchResults.getTotalElements() + " 条结果");
            
            searchResults.getContent().forEach(result -> {
                System.out.println("  - " + result.getTitle() + 
                                 " (作者: " + result.getAuthorNickname() + 
                                 ", 分类: " + result.getCategoryName() + ")");
            });
            
            // 4. 高级搜索
            System.out.println("\n4. 测试高级搜索...");
            SearchRequestDTO searchRequest = new SearchRequestDTO();
            searchRequest.setKeyword("Spring Boot");
            searchRequest.setStatus(1);
            searchRequest.setSortBy("time");
            searchRequest.setPage(1);
            searchRequest.setSize(3);
            
            Page<SearchResultVO> advancedResults = searchService.searchBlogs(searchRequest);
            System.out.println("✅ 高级搜索成功，共找到 " + advancedResults.getTotalElements() + " 条结果");
            
            // 5. 获取热门搜索词
            System.out.println("\n5. 获取热门搜索词...");
            List<String> hotKeywords = searchService.getHotSearchKeywords(5);
            System.out.println("✅ 热门搜索词: " + String.join(", ", hotKeywords));
            
            // 6. 获取搜索建议
            System.out.println("\n6. 获取搜索建议...");
            List<String> suggestions = searchService.getSearchSuggestions("Sp", 3);
            System.out.println("✅ 搜索建议: " + String.join(", ", suggestions));
            
            // 7. 同步单个博客
            System.out.println("\n7. 测试同步单个博客...");
            searchService.syncBlogToEs(1L);
            System.out.println("✅ 单个博客同步成功");
            
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("\n=== Elasticsearch搜索系统功能测试完成 ===");
    }
}