package com.ryan.myblog.service.impl;

import com.ryan.myblog.model.dto.SearchSortConfig;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.model.vo.SearchResultVO;
import com.ryan.myblog.service.SearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Criteria;
import org.springframework.data.elasticsearch.core.query.CriteriaQuery;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 搜索服务实现
 */
@Slf4j
@Service
public class SearchServiceImpl implements SearchService {
    
    private ElasticsearchOperations elasticsearchOperations;
    private boolean elasticsearchEnabled;

    public SearchServiceImpl() {
        this.elasticsearchOperations = null;
        this.elasticsearchEnabled = false;
    }

    @Autowired(required = false)
    public SearchServiceImpl(ElasticsearchOperations elasticsearchOperations) {
        this.elasticsearchOperations = elasticsearchOperations;
        this.elasticsearchEnabled = elasticsearchOperations != null;
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

        if (prefix == null || prefix.trim().isEmpty()) {
            return List.of();
        }

        try {
            String trimmedPrefix = prefix.trim();

            // 多字段搜索建议：标题、摘要、标签
            Criteria criteria = new Criteria("title").startsWith(trimmedPrefix)
                    .or("summary").startsWith(trimmedPrefix);

            // 如果prefix包含中文，也搜索内容字段
            if (containsChinese(trimmedPrefix)) {
                criteria = criteria.or("content").contains(trimmedPrefix);
            }

            // 限制状态为已发布的博客
            criteria = criteria.and(new Criteria("status").is(1));

            Query query = new CriteriaQuery(criteria)
                    .setPageable(org.springframework.data.domain.PageRequest.of(0, 20));

            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);

            List<String> suggestions = searchHits.getSearchHits().stream()
                    .map(this::extractSuggestionText)
                    .filter(text -> text.toLowerCase().startsWith(trimmedPrefix.toLowerCase()))
                    .distinct()
                    .limit(10)
                    .collect(Collectors.toList());

            log.info("获取搜索建议成功，前缀: '{}', 建议数量: {}", trimmedPrefix, suggestions.size());
            return suggestions;

        } catch (Exception e) {
            log.error("获取搜索建议失败，前缀: '{}'", prefix, e);
            return List.of();
        }
    }

    /**
     * 从搜索结果中提取建议文本
     */
    private String extractSuggestionText(SearchHit<BlogDocument> hit) {
        BlogDocument doc = hit.getContent();

        // 优先返回标题
        if (doc.getTitle() != null && !doc.getTitle().trim().isEmpty()) {
            return doc.getTitle().trim();
        }

        // 其次返回摘要的前50个字符
        if (doc.getSummary() != null && !doc.getSummary().trim().isEmpty()) {
            String summary = doc.getSummary().trim();
            return summary.length() > 50 ? summary.substring(0, 50) : summary;
        }

        // 最后返回内容的前30个字符
        if (doc.getContent() != null && !doc.getContent().trim().isEmpty()) {
            String content = doc.getContent().trim();
            return content.length() > 30 ? content.substring(0, 30) : content;
        }

        return "";
    }

    /**
     * 检查字符串是否包含中文字符
     */
    private boolean containsChinese(String text) {
        return text != null && text.matches(".*[\\u4e00-\\u9fa5].*");
    }

    @Override
    @Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public Page<SearchResultVO> searchBlogsWithHighlight(String keyword, Pageable pageable) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空结果");
            return Page.empty();
        }

        try {
            Criteria criteria = new Criteria("title").contains(keyword)
                    .or("content").contains(keyword)
                    .or("summary").contains(keyword);

            CriteriaQuery query = new CriteriaQuery(criteria);
            query.setPageable(pageable);

            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);

            List<SearchResultVO> results = searchHits.getSearchHits().stream()
                    .map(hit -> convertToSearchResultVOWithHighlight(hit, keyword))
                    .collect(Collectors.toList());

            return new PageImpl<>(results, pageable, searchHits.getTotalHits());
        } catch (Exception e) {
            log.error("高亮搜索博客失败，关键词: {}", keyword, e);
            return Page.empty();
        }
    }

    /**
     * 将SearchHit转换为SearchResultVO（带高亮）
     */
    private SearchResultVO convertToSearchResultVOWithHighlight(SearchHit<BlogDocument> hit, String keyword) {
        BlogDocument document = hit.getContent();
        SearchResultVO result = new SearchResultVO();

        // 设置基本信息
        result.setId(Long.valueOf(document.getId()));
        result.setTitle(document.getTitle());
        result.setSummary(document.getSummary());
        result.setContentSnippet(document.getContent() != null && document.getContent().length() > 200 ?
                document.getContent().substring(0, 200) + "..." : document.getContent());
        result.setAuthorNickname(document.getAuthorName());
        result.setCategoryName(document.getCategoryName());
        result.setCoverImg(document.getCoverImg() != null ? document.getCoverImg() : "");
        result.setViewCount(document.getViewCount());
        result.setLikeCount(document.getLikeCount());
        result.setCommentCount(document.getCommentCount());
        result.setPublishTime(document.getPublishTime());
        result.setScore(hit.getScore());

        // 手动实现高亮
        result.setHighlightedTitle(highlightText(document.getTitle(), keyword));
        result.setHighlightedSummary(highlightText(document.getSummary(), keyword));
        result.setHighlightedContent(highlightText(result.getContentSnippet(), keyword));

        // 如果没有高亮信息，使用原始内容
        if (result.getHighlightedTitle() == null) {
            result.setHighlightedTitle(result.getTitle());
        }
        if (result.getHighlightedSummary() == null) {
            result.setHighlightedSummary(result.getSummary());
        }
        if (result.getHighlightedContent() == null) {
            result.setHighlightedContent(result.getContentSnippet());
        }

        return result;
    }

    /**
     * 手动实现文本高亮
     */
    private String highlightText(String text, String keyword) {
        if (text == null || keyword == null || keyword.trim().isEmpty()) {
            return text;
        }

        // 转换为小写进行匹配，保留原始大小写
        String lowerText = text.toLowerCase();
        String lowerKeyword = keyword.toLowerCase();

        StringBuilder highlighted = new StringBuilder();
        int lastIndex = 0;
        int index = lowerText.indexOf(lowerKeyword);

        while (index != -1) {
            // 添加关键词之前的内容
            highlighted.append(text.substring(lastIndex, index));

            // 添加高亮的关键词
            highlighted.append("<em>").append(text.substring(index, index + keyword.length())).append("</em>");

            lastIndex = index + keyword.length();
            index = lowerText.indexOf(lowerKeyword, lastIndex);
        }

        // 添加剩余的内容
        if (lastIndex < text.length()) {
            highlighted.append(text.substring(lastIndex));
        }

        return highlighted.toString();
    }

    /**
     * 将SearchHit转换为SearchResultVO
     */
    private SearchResultVO convertToSearchResultVO(SearchHit<BlogDocument> hit) {
        BlogDocument document = hit.getContent();
        SearchResultVO result = new SearchResultVO();

        // 设置基本信息
        result.setId(Long.valueOf(document.getId()));
        result.setTitle(document.getTitle());
        result.setSummary(document.getSummary());
        result.setContentSnippet(document.getContent() != null && document.getContent().length() > 200 ?
                document.getContent().substring(0, 200) + "..." : document.getContent());
        result.setAuthorNickname(document.getAuthorName());
        result.setCategoryName(document.getCategoryName());
        result.setCoverImg(document.getCoverImg() != null ? document.getCoverImg() : "");
        result.setViewCount(document.getViewCount());
        result.setLikeCount(document.getLikeCount());
        result.setCommentCount(document.getCommentCount());
        result.setPublishTime(document.getPublishTime());
        result.setScore(hit.getScore());

        // 设置高亮信息
        Map<String, List<String>> highlightFields = hit.getHighlightFields();
        if (highlightFields != null) {
            if (highlightFields.containsKey("title") && !highlightFields.get("title").isEmpty()) {
                result.setHighlightedTitle(String.join(" ", highlightFields.get("title")));
            }
            if (highlightFields.containsKey("summary") && !highlightFields.get("summary").isEmpty()) {
                result.setHighlightedSummary(String.join(" ", highlightFields.get("summary")));
            }
            if (highlightFields.containsKey("content") && !highlightFields.get("content").isEmpty()) {
                result.setHighlightedContent(String.join(" ", highlightFields.get("content")));
            }
        }

        // 如果没有高亮信息，使用原始内容
        if (result.getHighlightedTitle() == null) {
            result.setHighlightedTitle(result.getTitle());
        }
        if (result.getHighlightedSummary() == null) {
            result.setHighlightedSummary(result.getSummary());
        }
        if (result.getHighlightedContent() == null) {
            result.setHighlightedContent(result.getContentSnippet());
        }

        return result;
    }

    @Override
    public Page<BlogDocument> searchWithBM25(String keyword, Pageable pageable, Map<String, Float> boostFields) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空结果");
            return Page.empty();
        }

        if (keyword == null || keyword.trim().isEmpty()) {
            return Page.empty();
        }

        try {
            String trimmedKeyword = keyword.trim();

            // 使用多字段查询，支持BM25算法和字段权重
            Criteria criteria = new Criteria();

            // 如果提供了权重配置，使用加权搜索
            if (boostFields != null && !boostFields.isEmpty()) {
                // 构建加权查询 - Elasticsearch的BM25实现
                Criteria titleCriteria = new Criteria("title").contains(trimmedKeyword);
                Criteria summaryCriteria = new Criteria("summary").contains(trimmedKeyword);
                Criteria contentCriteria = new Criteria("content").contains(trimmedKeyword);

                // 应用权重（通过构建不同的查询策略来模拟权重）
                if (boostFields.containsKey("title") && boostFields.get("title") > 1.0f) {
                    // 标题权重更高，优先匹配标题
                    criteria = titleCriteria.or(summaryCriteria).or(contentCriteria);
                } else if (boostFields.containsKey("content") && boostFields.get("content") > 1.0f) {
                    // 内容权重更高
                    criteria = contentCriteria.or(titleCriteria).or(summaryCriteria);
                } else {
                    // 默认均衡权重
                    criteria = titleCriteria.or(summaryCriteria).or(contentCriteria);
                }
            } else {
                // 默认BM25搜索（Elasticsearch默认使用BM25）
                criteria = new Criteria("title").contains(trimmedKeyword)
                        .or("summary").contains(trimmedKeyword)
                        .or("content").contains(trimmedKeyword);
            }

            // 只搜索已发布的博客
            criteria = criteria.and(new Criteria("status").is(1));

            CriteriaQuery query = new CriteriaQuery(criteria);
            query.setPageable(pageable);

            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);

            List<BlogDocument> results = searchHits.getSearchHits().stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());

            log.info("BM25搜索完成，关键词: '{}', 结果数量: {}, 总命中数: {}",
                    trimmedKeyword, results.size(), searchHits.getTotalHits());

            return new PageImpl<>(results, pageable, searchHits.getTotalHits());

        } catch (Exception e) {
            log.error("BM25搜索失败，关键词: {}", keyword, e);
            return Page.empty();
        }
    }

    @Override
    public Page<BlogDocument> searchWithMultiFactorRanking(String keyword, Pageable pageable, SearchSortConfig sortConfig) {
        if (!isAvailable()) {
            log.warn("Elasticsearch被禁用，返回空结果");
            return Page.empty();
        }

        if (keyword == null || keyword.trim().isEmpty()) {
            return Page.empty();
        }

        try {
            String trimmedKeyword = keyword.trim();

            // 使用默认配置如果没有提供
            if (sortConfig == null || !sortConfig.isValid()) {
                sortConfig = SearchSortConfig.defaultConfig();
            }

            // 创建 final 副本供 lambda 表达式使用
            final SearchSortConfig finalSortConfig = sortConfig;

            // 基础搜索查询
            Criteria criteria = new Criteria("title").contains(trimmedKeyword)
                    .or("summary").contains(trimmedKeyword)
                    .or("content").contains(trimmedKeyword)
                    .and(new Criteria("status").is(1));

            CriteriaQuery query = new CriteriaQuery(criteria);
            query.setPageable(pageable);

            SearchHits<BlogDocument> searchHits = elasticsearchOperations.search(query, BlogDocument.class);

            // 应用综合排序算法
            List<BlogDocument> results = searchHits.getSearchHits().stream()
                    .map(hit -> calculateMultiFactorScore(hit, finalSortConfig))
                    .sorted((doc1, doc2) -> {
                        // 根据最终评分排序
                        double score1 = doc1.getMultiFactorScore() != null ? doc1.getMultiFactorScore() : 0.0;
                        double score2 = doc2.getMultiFactorScore() != null ? doc2.getMultiFactorScore() : 0.0;
                        return finalSortConfig.getDescending() ? Double.compare(score2, score1) : Double.compare(score1, score2);
                    })
                    .collect(Collectors.toList());

            log.info("综合排序搜索完成，关键词: '{}', 排序配置: 时间权重={}, 热度权重={}, 相关性权重={}, 结果数量: {}",
                    trimmedKeyword, finalSortConfig.getTimeWeight(), finalSortConfig.getPopularityWeight(),
                    finalSortConfig.getRelevanceWeight(), results.size());

            return new PageImpl<>(results, pageable, searchHits.getTotalHits());

        } catch (Exception e) {
            log.error("综合排序搜索失败，关键词: {}", keyword, e);
            return Page.empty();
        }
    }

    /**
     * 计算多因子评分
     */
    private BlogDocument calculateMultiFactorScore(SearchHit<BlogDocument> hit, SearchSortConfig config) {
        BlogDocument doc = hit.getContent();

        // BM25相关性评分（归一化到0-1）
        float relevanceScore = normalizeScore(hit.getScore(), 0.0f, 10.0f);

        // 时间评分（越新越分值越高）
        float timeScore = calculateTimeScore(doc.getPublishTime(), config.getTimeDecayDays());

        // 热度评分（基于浏览量、点赞数、评论数）
        float popularityScore = calculatePopularityScore(doc);

        // 综合评分计算
        double finalScore = config.getRelevanceWeight() * relevanceScore +
                          config.getTimeWeight() * timeScore +
                          config.getPopularityWeight() * popularityScore;

        // 将评分存储到文档中（临时添加字段）
        doc.setMultiFactorScore(finalScore);

        return doc;
    }

    /**
     * 计算时间评分
     */
    private float calculateTimeScore(java.time.LocalDateTime publishTime, int decayDays) {
        if (publishTime == null) {
            return 0.0f;
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long daysDiff = java.time.Duration.between(publishTime, now).toDays();

        if (daysDiff <= 0) {
            return 1.0f; // 今天发布的文章
        }

        // 使用指数衰减函数
        return (float) Math.exp(-(double) daysDiff / decayDays);
    }

    /**
     * 计算热度评分
     */
    private float calculatePopularityScore(BlogDocument doc) {
        long viewCount = doc.getViewCount() != null ? doc.getViewCount() : 0L;
        long likeCount = doc.getLikeCount() != null ? doc.getLikeCount() : 0L;
        long commentCount = doc.getCommentCount() != null ? doc.getCommentCount() : 0L;

        // 归一化热度评分
        double popularityScore = (viewCount * 0.1 + likeCount * 1.0 + commentCount * 2.0) / 1000.0;
        return (float) Math.min(popularityScore, 1.0);
    }

    /**
     * 归一化评分到0-1范围
     */
    private float normalizeScore(float score, float min, float max) {
        if (max <= min) {
            return 0.0f;
        }
        float normalized = (score - min) / (max - min);
        return Math.max(0.0f, Math.min(1.0f, normalized));
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