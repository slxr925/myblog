package com.ryan.myblog.repository;

import com.ryan.myblog.document.BlogDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 博客Elasticsearch Repository
 */
@Repository
public interface BlogSearchRepository extends ElasticsearchRepository<BlogDocument, Long> {
    
    /**
     * 根据状态查询博客
     */
    Page<BlogDocument> findByStatus(Integer status, Pageable pageable);
    
    /**
     * 根据分类查询博客
     */
    Page<BlogDocument> findByCategoryIdAndStatus(Long categoryId, Integer status, Pageable pageable);
    
    /**
     * 根据标签查询博客
     */
    Page<BlogDocument> findByTagIdsInAndStatus(List<Long> tagIds, Integer status, Pageable pageable);
    
    /**
     * 根据作者查询博客
     */
    Page<BlogDocument> findByAuthorIdAndStatus(Long authorId, Integer status, Pageable pageable);
    
    /**
     * 多字段搜索 - 标题、摘要、内容
     */
    @Query("{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"summary^2\", \"content\"], \"type\": \"best_fields\", \"fuzziness\": \"AUTO\"}}")
    Page<BlogDocument> searchByMultiFields(String keyword, Pageable pageable);
    
    /**
     * 多字段搜索（指定状态）
     */
    @Query("{\"bool\": {\"must\": [{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"summary^2\", \"content\"], \"type\": \"best_fields\", \"fuzziness\": \"AUTO\"}}, {\"term\": {\"status\": ?1}}]}}")
    Page<BlogDocument> searchByMultiFieldsAndStatus(String keyword, Integer status, Pageable pageable);
    
    /**
     * 高级搜索 - 支持多条件组合
     */
    @Query("{\"bool\": {\"must\": [{\"multi_match\": {\"query\": \"?0\", \"fields\": [\"title^3\", \"summary^2\", \"content\"]}}, {\"term\": {\"status\": ?1}}], \"filter\": [{\"bool\": {\"should\": [{\"term\": {\"categoryId\": \"?2\"}}, {\"terms\": {\"tagIds\": [?3]}}]}}]}}")
    Page<BlogDocument> advancedSearch(String keyword, Integer status, Long categoryId, List<Long> tagIds, Pageable pageable);
}