package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.vo.RagSearchResult;
import com.ryan.myblog.model.vo.RagStatusVO;
import com.ryan.myblog.model.vo.TagVO;
import com.ryan.myblog.service.BlogRagService;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.client.Request;
import org.elasticsearch.client.ResponseException;
import org.elasticsearch.client.RestClient;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.elasticsearch.ElasticsearchVectorStore;
import org.springframework.ai.vectorstore.elasticsearch.ElasticsearchVectorStoreOptions;
import org.springframework.ai.vectorstore.elasticsearch.SimilarityFunction;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

/**
 * 基于Spring AI Elasticsearch VectorStore的博客RAG索引服务。
 */
@Slf4j
@Service
public class BlogRagServiceImpl implements BlogRagService {

    private static final int CHUNK_SIZE = 900;
    private static final int CHUNK_OVERLAP = 120;
    private static final int SNIPPET_MAX_CHARS = 360;
    private static final int HYBRID_RECALL_MULTIPLIER = 3;
    private static final Set<String> STOP_WORDS = Set.of(
            "帮我", "推荐", "一些", "相关", "文章", "博客", "内容", "一下", "看看", "有关", "关于", "这个", "那个",
            "的", "了", "和", "与", "及", "或", "是", "有哪些", "有些", "please", "recommend", "article", "articles",
            "blog", "blogs", "related", "some", "about", "the", "and", "or");
    private static final List<String> KNOWN_CHINESE_TERMS = List.of(
            "宿主机", "慢查询", "数据库", "索引", "容器", "配置", "访问", "后端", "前端", "缓存", "部署", "调试", "性能");

    private final BlogMapper blogMapper;
    private final CategoryMapper categoryMapper;
    private final TagMapper tagMapper;
    private final OpenAiRuntimeConfigService openAiRuntimeConfigService;
    private final RestClient ragRestClient;
    private final ObjectMapper objectMapper;

    private final AtomicBoolean rebuilding = new AtomicBoolean(false);
    private volatile String lastRebuildAt;
    private volatile CachedVectorStore cachedVectorStore;

    public BlogRagServiceImpl(BlogMapper blogMapper,
                              CategoryMapper categoryMapper,
                              TagMapper tagMapper,
                              OpenAiRuntimeConfigService openAiRuntimeConfigService,
                              @Qualifier("ragRestClient") RestClient ragRestClient,
                              ObjectMapper objectMapper) {
        this.blogMapper = blogMapper;
        this.categoryMapper = categoryMapper;
        this.tagMapper = tagMapper;
        this.openAiRuntimeConfigService = openAiRuntimeConfigService;
        this.ragRestClient = ragRestClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public void upsertBlogAsync(Long blogId) {
        if (blogId == null) {
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                upsertBlog(blogId);
            } catch (Exception e) {
                log.error("异步写入博客RAG索引失败 blogId={}", blogId, e);
            }
        });
    }

    @Override
    public void deleteBlogAsync(Long blogId) {
        if (blogId == null) {
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                deleteBlog(blogId);
            } catch (Exception e) {
                log.error("异步删除博客RAG索引失败 blogId={}", blogId, e);
            }
        });
    }

    @Override
    public List<RagSearchResult> search(String question, int topK, double similarityThreshold) {
        if (!openAiRuntimeConfigService.isRagAvailable() || question == null || question.isBlank()) {
            return List.of();
        }
        long start = System.currentTimeMillis();
        String trimmedQuestion = question.trim();
        String keywordQuery = normalizeSearchQuery(trimmedQuestion);
        int resultLimit = Math.max(1, topK);
        int recallLimit = Math.max(resultLimit, resultLimit * HYBRID_RECALL_MULTIPLIER);
        List<RagSearchResult> vectorResults = List.of();
        List<RagSearchResult> keywordResults = List.of();
        try {
            SearchRequest request = SearchRequest.builder()
                    .query(trimmedQuestion)
                    .topK(recallLimit)
                    .similarityThreshold(similarityThreshold)
                    .build();
            List<Document> documents = getVectorStore().similaritySearch(request);
            vectorResults = documents.stream()
                    .map(this::toSearchResult)
                    .filter(Objects::nonNull)
                    .map(result -> {
                        result.setVectorScore(result.getScore());
                        result.setMatchSource("vector");
                        return result;
                    })
                    .toList();
        } catch (Exception e) {
            log.warn("RAG向量检索失败，尝试关键词召回: {}", e.getMessage());
        }

        if (hasText(keywordQuery)) {
            try {
                keywordResults = keywordSearch(keywordQuery, recallLimit);
            } catch (Exception e) {
                log.warn("RAG关键词检索失败，继续使用向量结果 query={} error={}", keywordQuery, e.getMessage());
            }
        }

        List<RagSearchResult> results = mergeAndRerank(hasText(keywordQuery) ? keywordQuery : trimmedQuestion,
                vectorResults, keywordResults, resultLimit);
        log.info("RAG混合检索完成 query={} keywordQuery={} hitCount={} vectorHits={} keywordHits={} topK={} threshold={} elapsedMs={} topResults={}",
                trimmedQuestion, keywordQuery, results.size(), vectorResults.size(), keywordResults.size(), resultLimit,
                similarityThreshold, System.currentTimeMillis() - start, formatTopResults(results));
        return results;
    }

    @Override
    public RagStatusVO getStatus() {
        boolean embeddingAvailable = openAiRuntimeConfigService.getEmbeddingModel() != null;
        boolean ragAvailable = openAiRuntimeConfigService.isRagAvailable();
        return RagStatusVO.builder()
                .enabled(ragAvailable)
                .available(ragAvailable && indexExists())
                .embeddingAvailable(embeddingAvailable)
                .indexName(INDEX_NAME)
                .chunkCount(countChunks())
                .rebuilding(rebuilding.get())
                .lastRebuildAt(lastRebuildAt)
                .message(ragAvailable ? "RAG配置可用" : "RAG或Embedding未启用")
                .build();
    }

    @Override
    public RagStatusVO rebuildAllAsync() {
        if (!rebuilding.compareAndSet(false, true)) {
            return getStatus();
        }
        CompletableFuture.runAsync(() -> {
            try {
                rebuildAll();
                lastRebuildAt = Instant.now().toString();
            } catch (Exception e) {
                log.error("全量重建RAG索引失败", e);
            } finally {
                rebuilding.set(false);
            }
        });
        return getStatus();
    }

    private void upsertBlog(Long blogId) {
        if (!openAiRuntimeConfigService.isRagAvailable()) {
            log.info("RAG不可用，跳过博客向量索引 blogId={}", blogId);
            return;
        }
        Blog blog = blogMapper.selectById(blogId);
        if (!isIndexable(blog)) {
            deleteBlog(blogId);
            return;
        }
        deleteBlog(blogId);
        List<Document> documents = buildDocuments(blog);
        if (documents.isEmpty()) {
            return;
        }
        getVectorStore().add(documents);
        log.info("博客RAG索引写入完成 blogId={} chunks={}", blogId, documents.size());
    }

    private void deleteBlog(Long blogId) {
        if (!openAiRuntimeConfigService.isRagAvailable()) {
            return;
        }
        var expression = new FilterExpressionBuilder().eq("blogId", blogId).build();
        getVectorStore().delete(expression);
        log.info("博客RAG索引删除完成 blogId={}", blogId);
    }

    private void rebuildAll() {
        if (!openAiRuntimeConfigService.isRagAvailable()) {
            log.warn("RAG不可用，跳过全量重建");
            return;
        }
        deleteIndexIfExists();
        cachedVectorStore = null;
        List<Blog> blogs = blogMapper.selectList(new LambdaQueryWrapper<Blog>()
                .eq(Blog::getStatus, 1)
                .eq(Blog::getVisibility, 1)
                .orderByAsc(Blog::getId));
        int indexed = 0;
        for (Blog blog : blogs) {
            try {
                List<Document> documents = buildDocuments(blog);
                if (!documents.isEmpty()) {
                    getVectorStore().add(documents);
                    indexed += documents.size();
                }
            } catch (Exception e) {
                log.error("重建单篇博客RAG索引失败 blogId={}", blog.getId(), e);
            }
        }
        log.info("RAG全量重建完成 blogs={} chunks={}", blogs.size(), indexed);
    }

    private List<Document> buildDocuments(Blog blog) {
        Category category = blog.getCategoryId() != null ? categoryMapper.selectById(blog.getCategoryId()) : null;
        List<TagVO> tags = tagMapper.selectTagsByBlogId(blog.getId());
        String tagNames = tags == null ? "" : tags.stream().map(TagVO::getName).collect(Collectors.joining("、"));
        String categoryName = category != null ? category.getName() : "";
        String cleanContent = cleanText(blog.getContent());
        String contentHash = sha256(blog.getTitle() + "\n" + blog.getSummary() + "\n" + blog.getContent());
        List<String> chunks = splitChunks(cleanContent);
        if (chunks.isEmpty() && hasText(blog.getSummary())) {
            chunks = List.of(cleanText(blog.getSummary()));
        }

        List<Document> documents = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            String text = buildChunkText(blog, categoryName, tagNames, chunks.get(i));
            Map<String, Object> metadata = new LinkedHashMap<>();
            metadata.put("blogId", blog.getId());
            metadata.put("publicId", blog.getPublicId());
            metadata.put("title", blog.getTitle());
            metadata.put("categoryId", blog.getCategoryId());
            metadata.put("categoryName", categoryName);
            metadata.put("tags", tags != null ? tags : List.of());
            metadata.put("tagNames", tagNames);
            metadata.put("chunkIndex", i);
            metadata.put("publishTime", blog.getPublishTime() != null ? blog.getPublishTime().toString() : "");
            metadata.put("contentHash", contentHash);
            documents.add(Document.builder()
                    .id(blog.getId() + ":" + i + ":" + contentHash.substring(0, 12))
                    .text(text)
                    .metadata(metadata)
                    .build());
        }
        return documents;
    }

    private String buildChunkText(Blog blog, String categoryName, String tagNames, String chunk) {
        return "标题：" + nullToEmpty(blog.getTitle()) + "\n"
                + "摘要：" + nullToEmpty(blog.getSummary()) + "\n"
                + "分类：" + nullToEmpty(categoryName) + "\n"
                + "标签：" + nullToEmpty(tagNames) + "\n"
                + "正文片段：\n" + chunk;
    }

    private List<String> splitChunks(String content) {
        if (!hasText(content)) {
            return List.of();
        }
        List<String> chunks = new ArrayList<>();
        int start = 0;
        while (start < content.length()) {
            int end = Math.min(start + CHUNK_SIZE, content.length());
            chunks.add(content.substring(start, end).trim());
            if (end >= content.length()) {
                break;
            }
            start = Math.max(0, end - CHUNK_OVERLAP);
        }
        return chunks.stream().filter(chunk -> !chunk.isBlank()).toList();
    }

    private VectorStore getVectorStore() {
        String fingerprint = openAiRuntimeConfigService.getEmbeddingFingerprint();
        CachedVectorStore cached = cachedVectorStore;
        if (cached != null && cached.fingerprint().equals(fingerprint)) {
            return cached.vectorStore();
        }
        synchronized (this) {
            cached = cachedVectorStore;
            if (cached != null && cached.fingerprint().equals(fingerprint)) {
                return cached.vectorStore();
            }
            ElasticsearchVectorStoreOptions options = new ElasticsearchVectorStoreOptions();
            options.setIndexName(INDEX_NAME);
            options.setDimensions(openAiRuntimeConfigService.getEmbeddingDimensions());
            options.setSimilarity(SimilarityFunction.cosine);
            VectorStore vectorStore = ElasticsearchVectorStore.builder(ragRestClient, openAiRuntimeConfigService.getEmbeddingModel())
                    .options(options)
                    .initializeSchema(true)
                    .build();
            cachedVectorStore = new CachedVectorStore(fingerprint, vectorStore);
            return vectorStore;
        }
    }

    private RagSearchResult toSearchResult(Document document) {
        Map<String, Object> metadata = document.getMetadata();
        String title = asString(metadata.get("title"));
        Long blogId = asLong(metadata.get("blogId"));
        if (blogId == null || !hasText(title)) {
            return null;
        }
        RagSearchResult result = RagSearchResult.builder()
                .blogId(blogId)
                .publicId(asString(metadata.get("publicId")))
                .title(title)
                .categoryId(asLong(metadata.get("categoryId")))
                .categoryName(asString(metadata.get("categoryName")))
                .tags(asTags(metadata.get("tags")))
                .publishTime(asString(metadata.get("publishTime")))
                .chunkIndex(asInt(metadata.get("chunkIndex")))
                .snippet(truncate(document.getText(), SNIPPET_MAX_CHARS))
                .score(document.getScore())
                .vectorScore(document.getScore())
                .matchSource("vector")
                .build();
        return enrichMissingMetadata(result);
    }

    private List<RagSearchResult> keywordSearch(String question, int limit) throws Exception {
        Map<String, Object> query = Map.of(
                "multi_match", Map.of(
                        "query", question,
                        "fields", List.of("content", "metadata.title^4", "metadata.tagNames^3", "metadata.categoryName^2"),
                        "type", "best_fields",
                        "operator", "or",
                        "lenient", true));
        Map<String, Object> body = Map.of(
                "size", limit,
                "query", query);
        Request request = new Request("POST", "/" + INDEX_NAME + "/_search");
        request.setEntity(new StringEntity(objectMapper.writeValueAsString(body), ContentType.APPLICATION_JSON));
        var response = ragRestClient.performRequest(request);
        JsonNode root = objectMapper.readTree(response.getEntity().getContent());
        List<RagSearchResult> results = new ArrayList<>();
        for (JsonNode hit : root.path("hits").path("hits")) {
            RagSearchResult result = toKeywordSearchResult(hit);
            if (result != null) {
                results.add(result);
            }
        }
        return results;
    }

    private RagSearchResult toKeywordSearchResult(JsonNode hit) {
        JsonNode source = hit.path("_source");
        JsonNode metadata = source.path("metadata");
        Long blogId = asLong(metadata.path("blogId"));
        String title = metadata.path("title").asText("");
        if (blogId == null || !hasText(title)) {
            return null;
        }
        RagSearchResult result = RagSearchResult.builder()
                .blogId(blogId)
                .publicId(metadata.path("publicId").asText(""))
                .title(title)
                .categoryId(asLong(metadata.path("categoryId")))
                .categoryName(metadata.path("categoryName").asText(""))
                .tags(asTags(metadata.path("tags")))
                .publishTime(metadata.path("publishTime").asText(""))
                .chunkIndex(asInt(metadata.path("chunkIndex")))
                .snippet(truncate(source.path("content").asText(""), SNIPPET_MAX_CHARS))
                .keywordScore(hit.path("_score").asDouble(0.0))
                .matchSource("keyword")
                .build();
        return enrichMissingMetadata(result);
    }

    private List<RagSearchResult> mergeAndRerank(String question,
                                                 List<RagSearchResult> vectorResults,
                                                 List<RagSearchResult> keywordResults,
                                                 int topK) {
        Map<String, RagSearchResult> merged = new LinkedHashMap<>();
        for (RagSearchResult result : safeList(vectorResults)) {
            merged.put(candidateKey(result), copyResult(result));
        }
        for (RagSearchResult keywordResult : safeList(keywordResults)) {
            String key = candidateKey(keywordResult);
            RagSearchResult existing = merged.get(key);
            if (existing == null) {
                merged.put(key, copyResult(keywordResult));
            } else {
                mergeCandidate(existing, keywordResult);
            }
        }

        double maxKeywordScore = merged.values().stream()
                .map(RagSearchResult::getKeywordScore)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(0.0);

        return merged.values().stream()
                .map(result -> scoreCandidate(question, result, maxKeywordScore))
                .sorted(Comparator
                        .comparing((RagSearchResult result) -> nullToZero(result.getRerankScore())).reversed()
                        .thenComparing(result -> nullToZero(result.getScore()), Comparator.reverseOrder())
                        .thenComparing(RagSearchResult::getBlogId, Comparator.nullsLast(Long::compareTo)))
                .limit(Math.max(1, topK))
                .toList();
    }

    private RagSearchResult scoreCandidate(String question, RagSearchResult result, double maxKeywordScore) {
        double vector = clamp01(nullToZero(result.getVectorScore()));
        double keyword = maxKeywordScore > 0 ? clamp01(nullToZero(result.getKeywordScore()) / maxKeywordScore) : 0.0;
        double exactBoost = exactMatchBoost(question, result);
        double recencyBoost = recencyBoost(result.getPublishTime());
        double rerankScore = 0.6 * vector + 0.3 * keyword + 0.08 * exactBoost + 0.02 * recencyBoost;
        result.setRerankScore(rerankScore);
        result.setScore(rerankScore);
        result.setMatchSource(matchSource(result));
        return result;
    }

    private void mergeCandidate(RagSearchResult target, RagSearchResult source) {
        if (source.getVectorScore() != null) {
            target.setVectorScore(max(target.getVectorScore(), source.getVectorScore()));
        }
        if (source.getKeywordScore() != null) {
            target.setKeywordScore(max(target.getKeywordScore(), source.getKeywordScore()));
        }
        if (!hasText(target.getSnippet()) && hasText(source.getSnippet())) {
            target.setSnippet(source.getSnippet());
        }
        if (!hasText(target.getCategoryName()) && hasText(source.getCategoryName())) {
            target.setCategoryName(source.getCategoryName());
        }
        if (target.getCategoryId() == null && source.getCategoryId() != null) {
            target.setCategoryId(source.getCategoryId());
        }
        if ((target.getTags() == null || target.getTags().isEmpty()) && source.getTags() != null) {
            target.setTags(source.getTags());
        }
        if (!hasText(target.getPublishTime()) && hasText(source.getPublishTime())) {
            target.setPublishTime(source.getPublishTime());
        }
    }

    private RagSearchResult enrichMissingMetadata(RagSearchResult result) {
        if (result == null || result.getBlogId() == null || hasDisplayMetadata(result)) {
            return result;
        }
        Blog blog = blogMapper.selectById(result.getBlogId());
        if (blog == null) {
            return result;
        }
        if (result.getCategoryId() == null) {
            result.setCategoryId(blog.getCategoryId());
        }
        if (!hasText(result.getPublishTime()) && blog.getPublishTime() != null) {
            result.setPublishTime(blog.getPublishTime().toString());
        }
        if (!hasText(result.getCategoryName()) && blog.getCategoryId() != null) {
            Category category = categoryMapper.selectById(blog.getCategoryId());
            if (category != null) {
                result.setCategoryName(category.getName());
            }
        }
        if (result.getTags() == null || result.getTags().isEmpty()) {
            List<TagVO> tags = tagMapper.selectTagsByBlogId(result.getBlogId());
            result.setTags(tags != null ? tags : List.of());
        }
        return result;
    }

    private boolean hasDisplayMetadata(RagSearchResult result) {
        return hasText(result.getCategoryName())
                && result.getTags() != null && !result.getTags().isEmpty()
                && hasText(result.getPublishTime());
    }

    private double exactMatchBoost(String question, RagSearchResult result) {
        Set<String> tokens = tokenize(question);
        if (tokens.isEmpty()) {
            return 0.0;
        }
        String title = lower(result.getTitle());
        String category = lower(result.getCategoryName());
        String snippet = lower(result.getSnippet());
        Set<String> tags = safeList(result.getTags()).stream()
                .map(TagVO::getName)
                .filter(BlogRagServiceImpl::hasText)
                .map(BlogRagServiceImpl::lower)
                .collect(Collectors.toSet());
        double score = 0.0;
        for (String token : tokens) {
            if (title.contains(token)) {
                score += 0.45;
            }
            if (tags.stream().anyMatch(tag -> tag.contains(token) || token.contains(tag))) {
                score += 0.3;
            }
            if (category.contains(token)) {
                score += 0.2;
            }
            if (snippet.contains(token)) {
                score += 0.05;
            }
        }
        return clamp01(score);
    }

    private String normalizeSearchQuery(String question) {
        return String.join(" ", extractSearchTerms(question));
    }

    private Set<String> extractSearchTerms(String question) {
        if (!hasText(question)) {
            return Set.of();
        }
        Set<String> terms = new LinkedHashSet<>();
        String normalized = lower(question);
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("[a-z0-9+#.]+|[\\p{IsHan}]+")
                .matcher(normalized);
        while (matcher.find()) {
            String token = matcher.group();
            if (token.matches("[a-z0-9+#.]+")) {
                addSearchTerm(terms, token);
            } else {
                addChineseSearchTerms(terms, token);
            }
        }
        return terms;
    }

    private void addChineseSearchTerms(Set<String> terms, String token) {
        String cleaned = token;
        for (String stopWord : STOP_WORDS) {
            cleaned = cleaned.replace(stopWord, " ");
        }
        boolean matchedKnownTerm = false;
        for (String term : KNOWN_CHINESE_TERMS) {
            if (cleaned.contains(term)) {
                terms.add(term);
                matchedKnownTerm = true;
            }
        }
        if (!matchedKnownTerm) {
            for (String part : cleaned.split("\\s+")) {
                addSearchTerm(terms, part);
            }
        }
    }

    private void addSearchTerm(Set<String> terms, String token) {
        String term = token == null ? "" : token.trim();
        if (term.length() >= 2 && !isStopWord(term)) {
            terms.add(term);
        }
    }

    private boolean isStopWord(String token) {
        return token == null || STOP_WORDS.contains(token.trim().toLowerCase());
    }

    private double recencyBoost(String publishTime) {
        if (!hasText(publishTime)) {
            return 0.0;
        }
        try {
            LocalDateTime published = LocalDateTime.parse(publishTime);
            long days = Math.max(0, ChronoUnit.DAYS.between(published, LocalDateTime.now()));
            if (days <= 30) {
                return 1.0;
            }
            if (days <= 90) {
                return 0.7;
            }
            if (days <= 365) {
                return 0.3;
            }
        } catch (Exception ignored) {
            return 0.0;
        }
        return 0.0;
    }

    private Set<String> tokenize(String question) {
        if (!hasText(question)) {
            return Set.of();
        }
        Set<String> tokens = new HashSet<>();
        String normalized = lower(question);
        for (String token : normalized.split("[\\s,，。.!！?？;；:：()（）\\[\\]{}<>《》\"'`]+")) {
            if (token.length() >= 2) {
                tokens.add(token);
            }
        }
        if (normalized.length() >= 2 && normalized.length() <= 30) {
            tokens.add(normalized);
        }
        return tokens;
    }

    private String candidateKey(RagSearchResult result) {
        return String.valueOf(result.getBlogId());
    }

    private String matchSource(RagSearchResult result) {
        boolean hasVector = result.getVectorScore() != null;
        boolean hasKeyword = result.getKeywordScore() != null;
        if (hasVector && hasKeyword) {
            return "hybrid";
        }
        return hasKeyword ? "keyword" : "vector";
    }

    private RagSearchResult copyResult(RagSearchResult source) {
        return RagSearchResult.builder()
                .blogId(source.getBlogId())
                .publicId(source.getPublicId())
                .title(source.getTitle())
                .categoryId(source.getCategoryId())
                .categoryName(source.getCategoryName())
                .tags(source.getTags())
                .publishTime(source.getPublishTime())
                .chunkIndex(source.getChunkIndex())
                .snippet(source.getSnippet())
                .score(source.getScore())
                .vectorScore(source.getVectorScore())
                .keywordScore(source.getKeywordScore())
                .rerankScore(source.getRerankScore())
                .matchSource(source.getMatchSource())
                .build();
    }

    private String formatTopResults(List<RagSearchResult> results) {
        return safeList(results).stream()
                .map(result -> String.format("{blogId=%s,title=%s,source=%s,vector=%.4f,keyword=%.4f,rerank=%.4f}",
                        result.getBlogId(),
                        result.getTitle(),
                        result.getMatchSource(),
                        nullToZero(result.getVectorScore()),
                        nullToZero(result.getKeywordScore()),
                        nullToZero(result.getRerankScore())))
                .collect(Collectors.joining("; "));
    }

    private boolean indexExists() {
        try {
            ragRestClient.performRequest(new Request("HEAD", "/" + INDEX_NAME));
            return true;
        } catch (ResponseException e) {
            return e.getResponse().getStatusLine().getStatusCode() != 404;
        } catch (Exception e) {
            return false;
        }
    }

    private Long countChunks() {
        try {
            var response = ragRestClient.performRequest(new Request("GET", "/" + INDEX_NAME + "/_count"));
            JsonNode root = objectMapper.readTree(response.getEntity().getContent());
            return root.path("count").asLong(0L);
        } catch (Exception e) {
            return 0L;
        }
    }

    private void deleteIndexIfExists() {
        try {
            ragRestClient.performRequest(new Request("DELETE", "/" + INDEX_NAME));
        } catch (ResponseException e) {
            if (e.getResponse().getStatusLine().getStatusCode() != 404) {
                throw new IllegalStateException("删除RAG索引失败", e);
            }
        } catch (Exception e) {
            throw new IllegalStateException("删除RAG索引失败", e);
        }
    }

    private boolean isIndexable(Blog blog) {
        return blog != null && Objects.equals(blog.getStatus(), 1) && Objects.equals(blog.getVisibility(), 1);
    }

    private static String cleanText(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("(?s)```.*?```", " ")
                .replaceAll("!\\[[^]]*]\\([^)]*\\)", " ")
                .replaceAll("\\[[^]]*]\\([^)]*\\)", " ")
                .replaceAll("[#>*_`~\\-]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String sha256(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(nullToEmpty(text).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return Integer.toHexString(nullToEmpty(text).hashCode());
        }
    }

    private static String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars).trim() + "...";
    }

    private static String asString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static Long asLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return value != null ? Long.parseLong(String.valueOf(value)) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Integer asInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return value != null ? Integer.parseInt(String.valueOf(value)) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Long asLong(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.longValue();
        }
        return asLong(value.asText());
    }

    private static Integer asInt(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return null;
        }
        if (value.isNumber()) {
            return value.intValue();
        }
        return asInt(value.asText());
    }

    private static List<TagVO> asTags(Object value) {
        if (value == null) {
            return List.of();
        }
        if (value instanceof Collection<?> values) {
            return values.stream()
                    .map(BlogRagServiceImpl::asTag)
                    .filter(Objects::nonNull)
                    .toList();
        }
        if (value instanceof JsonNode node) {
            return asTags(node);
        }
        return List.of();
    }

    private static List<TagVO> asTags(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return List.of();
        }
        if (!node.isArray()) {
            return List.of();
        }
        List<TagVO> tags = new ArrayList<>();
        for (JsonNode item : node) {
            TagVO tag = new TagVO();
            tag.setId(asLong(item.path("id")));
            tag.setName(item.path("name").asText(""));
            tag.setColor(item.path("color").asText(null));
            if (hasText(tag.getName())) {
                tags.add(tag);
            }
        }
        return tags;
    }

    @SuppressWarnings("unchecked")
    private static TagVO asTag(Object value) {
        if (value instanceof TagVO tag) {
            return tag;
        }
        if (!(value instanceof Map<?, ?> rawMap)) {
            return null;
        }
        Map<String, Object> map = (Map<String, Object>) rawMap;
        TagVO tag = new TagVO();
        tag.setId(asLong(map.get("id")));
        tag.setName(asString(map.get("name")));
        tag.setColor(asString(map.get("color")));
        return hasText(tag.getName()) ? tag : null;
    }

    private static <T> List<T> safeList(List<T> values) {
        return values != null ? values : List.of();
    }

    private static double nullToZero(Double value) {
        return value != null ? value : 0.0;
    }

    private static double max(Double left, Double right) {
        return Math.max(nullToZero(left), nullToZero(right));
    }

    private static double clamp01(double value) {
        return Math.max(0.0, Math.min(1.0, value));
    }

    private static String lower(String value) {
        return nullToEmpty(value).toLowerCase(java.util.Locale.ROOT);
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record CachedVectorStore(String fingerprint, VectorStore vectorStore) {
    }
}
