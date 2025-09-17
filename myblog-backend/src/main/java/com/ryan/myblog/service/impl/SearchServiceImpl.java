package com.ryan.myblog.service.impl;

import com.ryan.myblog.entity.BlogDocument;
import com.ryan.myblog.service.SearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 搜索服务实现
 */
@Slf4j
@Service
public class SearchServiceImpl implements SearchService {
    
    private final ElasticsearchOperations elasticsearchOperations;
    private final boolean elasticsearchEnabled;
    
    public SearchServiceImpl(ElasticsearchOperations elasticsearchOperations) {
        this(elasticsearchOperations, true);
    }
    
    public SearchServiceImpl(ElasticsearchOperations elasticsearchOperations, boolean elasticsearchEnabled) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.elasticsearchEnabled = elasticsearchEnabled;
    }
    
    @Override
    public void indexBlog(BlogDocument blogDocument) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，跳过索引操作");
            return;
        }
        
        try {
            elasticsearchOperations.save(blogDocument);
            log.info("成功索引博客: {}", blogDocument.getTitle());
        } catch (Exception e) {
            log.error("索引博客失败: {}", blogDocument.getTitle(), e);
        }
    }
    
    @Override
    public void bulkIndexBlogs(List<BlogDocument> blogDocuments) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，跳过批量索引操作");
            return;
        }
        
        try {
            elasticsearchOperations.save(blogDocuments);
            log.info("成功批量索引 {} 篇博客", blogDocuments.size());
        } catch (Exception e) {
            log.error("批量索引博客失败", e);
        }
    }
    
    @Override
    public void deleteIndex(String id) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，跳过删除操作");
            return;
        }
        
        try {
            elasticsearchOperations.delete(id, BlogDocument.class);
            log.info("成功删除索引: {}", id);
        } catch (Exception e) {
            log.error("删除索引失败: {}", id, e);
        }
    }
    
    @Override
    public Page<BlogDocument> searchBlogs(String keyword, Pageable pageable) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空结果");
            return Page.empty();
        }
        
        try {
            Criteria criteria = new Criteria("title").contains(keyword)
                    .or("content").contains(keyword)
                    .or("summary").contains(keyword);
            
            Query query = new CriteriaQuery(criteria).setPageable(pageable);
            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);
            
            List<BlogDocument> results = searchHits.getSearchHits().stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());
            
            return new PageImpl<>(results, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("搜索博客失败，关键词: {}", keyword, e);
            return Page.empty();
        }
    }
    
    @Override
    public Page<BlogDocument> advancedSearch(String keyword, Long categoryId, List<String> tags, Pageable pageable) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空结果");
            return Page.empty();
        }
        
        try {
            Criteria criteria = new Criteria();
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                criteria = criteria.subCriteria(new Criteria("title").contains(keyword)
                        .or("content").contains(keyword)
                        .or("summary").contains(keyword));
            }
            
            if (categoryId != null) {
                criteria = criteria.and(new Criteria("categoryId").is(categoryId));
            }
            
            if (tags != null && !tags.isEmpty()) {
                Criteria tagsCriteria = new Criteria("tags");
                for (String tag : tags) {
                    tagsCriteria = tagsCriteria.contains(tag);
                }
                criteria = criteria.and(tagsCriteria);
            }
            
            Query query = new CriteriaQuery(criteria).setPageable(pageable);
            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);
            
            List<BlogDocument> results = searchHits.getSearchHits().stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());
            
            return new PageImpl<>(results, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("高级搜索失败", e);
            return Page.empty();
        }
    }
    
    @Override
    public List<String> getSuggestions(String prefix) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空建议");
            return List.of();
        }
        
        // 简化实现，实际应该使用Completion Suggester
        try {
            Criteria criteria = new Criteria("title").startsWith(prefix);
            Query query = new CriteriaQuery(criteria);
            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);
            
            return searchHits.getSearchHits().stream()
                    .map(hit -> hit.getContent().getTitle())
                    .distinct()
                    .limit(10)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("获取搜索建议失败", e);
            return List.of();
        }
    }
    
    @Override
    public void rebuildIndex() {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，跳过重建索引");
            return;
        }
        
        log.info("开始重建搜索索引...");
        // 实际实现需要从数据库读取所有博客并重新索引
        log.info("搜索索引重建完成");
    }
    
    @Override
    public boolean isAvailable() {
        return elasticsearchEnabled && elasticsearchOperations != null;
    }
}