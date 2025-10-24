package com.ryan.myblog.service;

import com.ryan.myblog.model.dto.SearchSortConfig;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.model.vo.SearchHighlightVO;
import com.ryan.myblog.model.vo.SearchResultVO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

/**
 * 搜索服务接口
 */
public interface SearchService {
    
    /**
     * 索引博客文档
     * @param blogDocument 博客文档
     */
    void indexBlog(BlogDocument blogDocument);
    
    /**
     * 批量索引博客文档
     * @param blogDocuments 博客文档列表
     */
    void bulkIndexBlogs(List<BlogDocument> blogDocuments);
    
    /**
     * 根据ID删除索引
     * @param id 文档ID
     */
    void deleteIndex(String id);
    
    /**
     * 搜索博客
     * @param keyword 关键词
     * @param pageable 分页信息
     * @return 搜索结果
     */
    Page<BlogDocument> searchBlogs(String keyword, Pageable pageable);
    
    /**
     * 高级搜索
     * @param keyword 关键词
     * @param categoryId 分类ID
     * @param tags 标签列表
     * @param pageable 分页信息
     * @return 搜索结果
     */
    Page<BlogDocument> advancedSearch(String keyword, Long categoryId, List<String> tags, Pageable pageable);
    
    /**
     * 获取搜索建议
     * @param prefix 前缀
     * @return 建议列表
     */
    List<String> getSuggestions(String prefix);
    
    /**
     * 重建索引
     */
    void rebuildIndex();
    
    /**
     * 带高亮的搜索博客
     * @param keyword 关键词
     * @param pageable 分页信息
     * @return 带高亮信息的搜索结果
     */
    Page<SearchResultVO> searchBlogsWithHighlight(String keyword, Pageable pageable);

    /**
     * 使用BM25算法进行优化搜索
     * @param keyword 搜索关键词
     * @param pageable 分页参数
     * @param boostFields 字段权重配置
     * @return 搜索结果页面
     */
    Page<BlogDocument> searchWithBM25(String keyword, Pageable pageable, Map<String, Float> boostFields);

    /**
     * 综合排序搜索（时间、热度、匹配度）
     * @param keyword 搜索关键词
     * @param pageable 分页参数
     * @param sortConfig 排序配置
     * @return 搜索结果页面
     */
    Page<BlogDocument> searchWithMultiFactorRanking(String keyword, Pageable pageable, SearchSortConfig sortConfig);

    /**
     * 检查搜索服务状态
     * @return 是否可用
     */
    boolean isAvailable();
}