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
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
        try {
            SearchRequest request = SearchRequest.builder()
                    .query(question.trim())
                    .topK(topK)
                    .similarityThreshold(similarityThreshold)
                    .build();
            List<Document> documents = getVectorStore().similaritySearch(request);
            List<RagSearchResult> results = documents.stream()
                    .map(this::toSearchResult)
                    .filter(Objects::nonNull)
                    .toList();
            log.info("RAG检索完成 hitCount={} topK={} threshold={} elapsedMs={}",
                    results.size(), topK, similarityThreshold, System.currentTimeMillis() - start);
            return results;
        } catch (Exception e) {
            log.warn("RAG检索失败，回退普通AI问答: {}", e.getMessage());
            return List.of();
        }
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
        return RagSearchResult.builder()
                .blogId(blogId)
                .publicId(asString(metadata.get("publicId")))
                .title(title)
                .chunkIndex(asInt(metadata.get("chunkIndex")))
                .snippet(truncate(document.getText(), SNIPPET_MAX_CHARS))
                .score(document.getScore())
                .build();
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

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record CachedVectorStore(String fingerprint, VectorStore vectorStore) {
    }
}
