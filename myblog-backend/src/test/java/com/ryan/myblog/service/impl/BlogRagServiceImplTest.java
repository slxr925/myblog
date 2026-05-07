package com.ryan.myblog.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.vo.RagSearchResult;
import com.ryan.myblog.model.vo.TagVO;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import org.elasticsearch.client.RestClient;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BlogRagServiceImplTest {

    @Mock
    private BlogMapper blogMapper;

    @Mock
    private CategoryMapper categoryMapper;

    @Mock
    private TagMapper tagMapper;

    @Mock
    private OpenAiRuntimeConfigService openAiRuntimeConfigService;

    @Mock
    private RestClient ragRestClient;

    @Test
    void buildDocumentsStoresDisplayMetadataForRagHits() {
        BlogRagServiceImpl service = newService();
        Blog blog = blog();
        Category category = category(7L, "后端");
        TagVO spring = tag(1L, "Spring", "#6db33f");
        TagVO ai = tag(2L, "AI", "#2563eb");

        when(categoryMapper.selectById(7L)).thenReturn(category);
        when(tagMapper.selectTagsByBlogId(42L)).thenReturn(List.of(spring, ai));

        @SuppressWarnings("unchecked")
        List<Document> documents = ReflectionTestUtils.invokeMethod(service, "buildDocuments", blog);

        assertNotNull(documents);
        Map<String, Object> metadata = documents.getFirst().getMetadata();
        assertEquals(7L, metadata.get("categoryId"));
        assertEquals("后端", metadata.get("categoryName"));
        assertEquals("Spring、AI", metadata.get("tagNames"));
        assertEquals(List.of(spring, ai), metadata.get("tags"));
        assertEquals("2026-05-01T09:30", metadata.get("publishTime"));
    }

    @Test
    void toSearchResultBackfillsMissingMetadataFromDatabase() {
        BlogRagServiceImpl service = newService();
        Blog blog = blog();
        Category category = category(7L, "后端");
        TagVO spring = tag(1L, "Spring", "#6db33f");

        when(blogMapper.selectById(42L)).thenReturn(blog);
        when(categoryMapper.selectById(7L)).thenReturn(category);
        when(tagMapper.selectTagsByBlogId(42L)).thenReturn(List.of(spring));

        Document oldDocument = Document.builder()
                .id("42:0:legacy")
                .text("标题：Spring AI 实践\n正文片段：RAG 检索")
                .metadata(Map.of(
                        "blogId", 42L,
                        "publicId", "pub-42",
                        "title", "Spring AI 实践",
                        "chunkIndex", 0))
                .score(0.82)
                .build();

        RagSearchResult result = ReflectionTestUtils.invokeMethod(service, "toSearchResult", oldDocument);

        assertNotNull(result);
        assertEquals(7L, result.getCategoryId());
        assertEquals("后端", result.getCategoryName());
        assertEquals(List.of(spring), result.getTags());
        assertEquals("2026-05-01T09:30", result.getPublishTime());
    }

    @Test
    void mergeAndRerankCombinesVectorKeywordAndMetadataSignals() {
        BlogRagServiceImpl service = newService();
        RagSearchResult vectorOnly = RagSearchResult.builder()
                .blogId(1L)
                .title("Redis 性能实践")
                .snippet("缓存和限流")
                .score(0.92)
                .vectorScore(0.92)
                .build();
        RagSearchResult hybrid = RagSearchResult.builder()
                .blogId(2L)
                .title("Spring AI RAG 实践")
                .categoryName("AI")
                .tags(List.of(tag(3L, "RAG", "#111827")))
                .snippet("Spring AI 向量检索和 RAG")
                .score(0.78)
                .vectorScore(0.78)
                .build();
        RagSearchResult keyword = RagSearchResult.builder()
                .blogId(2L)
                .title("Spring AI RAG 实践")
                .categoryName("AI")
                .tags(List.of(tag(3L, "RAG", "#111827")))
                .snippet("Spring AI 向量检索和 RAG")
                .keywordScore(12.0)
                .build();

        @SuppressWarnings("unchecked")
        List<RagSearchResult> reranked = ReflectionTestUtils.invokeMethod(
                service,
                "mergeAndRerank",
                "Spring AI RAG",
                List.of(vectorOnly, hybrid),
                List.of(keyword),
                2);

        assertNotNull(reranked);
        assertEquals(2L, reranked.getFirst().getBlogId());
        assertEquals("hybrid", reranked.getFirst().getMatchSource());
        assertEquals(1L, reranked.get(1).getBlogId());
    }

    private BlogRagServiceImpl newService() {
        return new BlogRagServiceImpl(
                blogMapper,
                categoryMapper,
                tagMapper,
                openAiRuntimeConfigService,
                ragRestClient,
                new ObjectMapper());
    }

    private Blog blog() {
        Blog blog = new Blog();
        blog.setId(42L);
        blog.setPublicId("pub-42");
        blog.setTitle("Spring AI 实践");
        blog.setSummary("RAG 检索增强");
        blog.setContent("Spring AI 可以构建 RAG 应用。");
        blog.setCategoryId(7L);
        blog.setPublishTime(LocalDateTime.of(2026, 5, 1, 9, 30));
        return blog;
    }

    private Category category(Long id, String name) {
        Category category = new Category();
        category.setId(id);
        category.setName(name);
        return category;
    }

    private TagVO tag(Long id, String name, String color) {
        TagVO tag = new TagVO();
        tag.setId(id);
        tag.setName(name);
        tag.setColor(color);
        return tag;
    }
}
