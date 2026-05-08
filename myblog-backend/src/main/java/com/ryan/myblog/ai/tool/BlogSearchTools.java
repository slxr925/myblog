package com.ryan.myblog.ai.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.ai.observability.AiToolExecutionContext;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.model.vo.RagSearchResult;
import com.ryan.myblog.service.BlogRagService;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BlogSearchTools {

    private static final int CONTENT_SNIPPET_CHARS = 1200;

    private final BlogRagService blogRagService;
    private final BlogService blogService;
    private final OpenAiRuntimeConfigService openAiRuntimeConfigService;
    private final AiObservabilityService observabilityService;
    private final ObjectMapper objectMapper;

    @Tool(description = "Search public MyBlog articles by a natural language question. Use this for article lookup and recommendations.")
    public List<ArticleToolResult> searchArticles(String question, Integer topK) {
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("question", safe(question));
        args.put("topK", topK);
        return ToolSupport.observe("searchArticles", args,
                observabilityService, objectMapper, () -> doSearchArticles(question, topK));
    }

    @Tool(description = "Get article context by publicId or internal blogId. Use publicId when available.")
    public ArticleContextToolResult getArticleContext(String publicId, Long blogId) {
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("publicId", safe(publicId));
        args.put("blogId", blogId);
        return ToolSupport.observe("getArticleContext", args,
                observabilityService, objectMapper, () -> doGetArticleContext(publicId, blogId));
    }

    private List<ArticleToolResult> doSearchArticles(String question, Integer topK) {
        int limit = ToolSupport.clampLimit(topK, openAiRuntimeConfigService.getRagTopK(), 8);
        if (hasText(question)) {
            List<RagSearchResult> ragResults = blogRagService.search(question, limit,
                    openAiRuntimeConfigService.getRagSimilarityThreshold());
            if (!ragResults.isEmpty()) {
                return ragResults.stream().map(this::fromRag).toList();
            }
            List<BlogListVO> searchResults = blogService.searchBlogs(question, limit);
            if (searchResults != null && !searchResults.isEmpty()) {
                return searchResults.stream().map(this::fromList).toList();
            }
        }
        return blogService.getLatestBlogs(limit).stream().map(this::fromDetail).toList();
    }

    private ArticleContextToolResult doGetArticleContext(String publicId, Long blogId) {
        BlogDetailVO blog = null;
        if (hasText(publicId)) {
            blog = blogService.getPublicBlogDetail(publicId);
        } else if (blogId != null) {
            AiToolExecutionContext.Context context = AiToolExecutionContext.get();
            try {
                blog = blogService.getInternalBlogDetail(blogId, context != null ? context.userId() : null);
            } catch (Exception ignored) {
                blog = null;
            }
        }
        if (blog == null) {
            return ArticleContextToolResult.builder()
                    .title("未找到可访问文章")
                    .contentSnippet("")
                    .visibility("unavailable")
                    .build();
        }
        return ArticleContextToolResult.builder()
                .id(blog.getId())
                .publicId(blog.getPublicId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .contentSnippet(ToolSupport.truncate(cleanText(blog.getContent()), CONTENT_SNIPPET_CHARS))
                .categoryId(blog.getCategoryId())
                .categoryName(blog.getCategoryName())
                .tags(blog.getTags())
                .visibility(blog.getVisibility() != null && blog.getVisibility() == 1 ? "public" : "restricted")
                .build();
    }

    private ArticleToolResult fromRag(RagSearchResult result) {
        return ArticleToolResult.builder()
                .id(result.getBlogId())
                .publicId(result.getPublicId())
                .title(result.getTitle())
                .categoryId(result.getCategoryId())
                .categoryName(result.getCategoryName())
                .tags(result.getTags())
                .publishTime(result.getPublishTime())
                .snippet(result.getSnippet())
                .score(result.getScore())
                .matchSource(result.getMatchSource())
                .build();
    }

    private ArticleToolResult fromList(BlogListVO blog) {
        return ArticleToolResult.builder()
                .id(blog.getId())
                .publicId(blog.getPublicId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .categoryId(blog.getCategoryId())
                .categoryName(blog.getCategoryName())
                .tags(blog.getTags())
                .publishTime(blog.getPublishTime() != null ? blog.getPublishTime().toString() : null)
                .snippet(blog.getSummary())
                .matchSource("keyword")
                .build();
    }

    private ArticleToolResult fromDetail(BlogDetailVO blog) {
        return ArticleToolResult.builder()
                .id(blog.getId())
                .publicId(blog.getPublicId())
                .title(blog.getTitle())
                .summary(blog.getSummary())
                .categoryId(blog.getCategoryId())
                .categoryName(blog.getCategoryName())
                .tags(blog.getTags())
                .publishTime(blog.getPublishTime() != null ? blog.getPublishTime().toString() : null)
                .snippet(blog.getSummary())
                .matchSource("latest")
                .build();
    }

    private static String cleanText(String text) {
        if (text == null) {
            return "";
        }
        return text.replaceAll("(?s)```.*?```", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
