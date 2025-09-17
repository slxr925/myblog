package com.ryan.myblog.service;

import com.ryan.myblog.entity.BlogDocument;
import com.ryan.myblog.service.impl.SearchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * SearchService单元测试
 */
@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ElasticsearchOperations elasticsearchOperations;
    
    private SearchService searchService;

    private BlogDocument testBlog;

    @BeforeEach
    void setUp() {
        searchService = new SearchServiceImpl(elasticsearchOperations, true);

        testBlog = new BlogDocument();
        testBlog.setId("1");
        testBlog.setTitle("测试博客");
        testBlog.setSummary("这是一个测试博客的摘要");
        testBlog.setContent("这是测试博客的完整内容");
        testBlog.setAuthorId(1L);
        testBlog.setAuthorName("测试作者");
        testBlog.setCategoryId(1L);
        testBlog.setCategoryName("测试分类");
        testBlog.setTags(new String[] { "测试", "Java" });
        testBlog.setStatus(1);
        testBlog.setIsTop(false);
        testBlog.setViewCount(100L);
        testBlog.setLikeCount(10L);
        testBlog.setCommentCount(5L);
        testBlog.setPublishTime(LocalDateTime.now());
        testBlog.setCreateTime(LocalDateTime.now());
        testBlog.setUpdateTime(LocalDateTime.now());
    }

    @Test
    void testIsAvailable_WhenElasticsearchEnabled_ShouldReturnTrue() {
        assertTrue(searchService.isAvailable());
    }

    @Test
    void testIndexBlog_WhenElasticsearchEnabled_ShouldCallSave() {
        searchService.indexBlog(testBlog);

        verify(elasticsearchOperations, times(1)).save(testBlog);
    }

    @Test
    void testBulkIndexBlogs_WhenElasticsearchEnabled_ShouldCallSave() {
        List<BlogDocument> blogs = List.of(testBlog);

        searchService.bulkIndexBlogs(blogs);

        verify(elasticsearchOperations, times(1)).save(blogs);
    }

    @Test
    void testDeleteIndex_WhenElasticsearchEnabled_ShouldCallDelete() {
        searchService.deleteIndex("1");

        verify(elasticsearchOperations, times(1)).delete("1", BlogDocument.class);
    }

    @Test
    void testSearchBlogs_WhenElasticsearchEnabled_ShouldReturnResults() {
        // 模拟Elasticsearch返回结果
        SearchHit<BlogDocument> searchHit = mock(SearchHit.class);
        when(searchHit.getContent()).thenReturn(testBlog);

        SearchHits<BlogDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getSearchHits()).thenReturn(List.of(searchHit));
        when(searchHits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(Query.class), eq(BlogDocument.class)))
                .thenReturn(searchHits);

        Pageable pageable = PageRequest.of(0, 10);
        Page<BlogDocument> result = searchService.searchBlogs("测试", pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("测试博客", result.getContent().get(0).getTitle());
    }

    @Test
    void testSearchBlogs_WhenExceptionOccurs_ShouldReturnEmptyPage() {
        when(elasticsearchOperations.search(any(Query.class), eq(BlogDocument.class)))
                .thenThrow(new RuntimeException("搜索失败"));

        Pageable pageable = PageRequest.of(0, 10);
        Page<BlogDocument> result = searchService.searchBlogs("测试", pageable);

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testAdvancedSearch_WithCategoryAndTags_ShouldReturnResults() {
        SearchHit<BlogDocument> searchHit = mock(SearchHit.class);
        when(searchHit.getContent()).thenReturn(testBlog);

        SearchHits<BlogDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getSearchHits()).thenReturn(List.of(searchHit));
        when(searchHits.getTotalHits()).thenReturn(1L);

        when(elasticsearchOperations.search(any(Query.class), eq(BlogDocument.class)))
                .thenReturn(searchHits);

        Pageable pageable = PageRequest.of(0, 10);
        Page<BlogDocument> result = searchService.advancedSearch(
                "测试", 1L, List.of("Java"), pageable);

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void testGetSuggestions_WhenPrefixProvided_ShouldReturnSuggestions() {
        SearchHit<BlogDocument> searchHit = mock(SearchHit.class);
        when(searchHit.getContent()).thenReturn(testBlog);

        SearchHits<BlogDocument> searchHits = mock(SearchHits.class);
        when(searchHits.getSearchHits()).thenReturn(List.of(searchHit));

        when(elasticsearchOperations.search(any(Query.class), eq(BlogDocument.class)))
                .thenReturn(searchHits);

        List<String> suggestions = searchService.getSuggestions("测试");

        assertNotNull(suggestions);
        assertFalse(suggestions.isEmpty());
        assertEquals("测试博客", suggestions.get(0));
    }

    @Test
    void testRebuildIndex_WhenCalled_ShouldLogMessage() {
        // 这个方法主要是记录日志，我们验证它不会抛出异常
        assertDoesNotThrow(() -> searchService.rebuildIndex());
    }
}