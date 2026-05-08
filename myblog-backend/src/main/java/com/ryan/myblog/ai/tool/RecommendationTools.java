package com.ryan.myblog.ai.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RecommendationTools {

    private final BlogService blogService;
    private final BlogSearchTools blogSearchTools;
    private final AiObservabilityService observabilityService;
    private final ObjectMapper objectMapper;

    @Tool(description = "Recommend similar public MyBlog articles by blogId or free-form content.")
    public List<ArticleToolResult> recommendSimilarArticles(Long blogId, String content, Integer topK) {
        Map<String, Object> args = new LinkedHashMap<>();
        args.put("blogId", blogId);
        args.put("contentChars", content == null ? 0 : content.length());
        args.put("topK", topK);
        return ToolSupport.observe("recommendSimilarArticles", args,
                observabilityService, objectMapper, () -> doRecommendSimilarArticles(blogId, content, topK));
    }

    private List<ArticleToolResult> doRecommendSimilarArticles(Long blogId, String content, Integer topK) {
        int limit = ToolSupport.clampLimit(topK, 5, 8);
        if (blogId != null) {
            List<BlogDetailVO> related = blogService.getRelatedBlogs(blogId, limit);
            if (related != null && !related.isEmpty()) {
                return related.stream().map(this::fromDetail).toList();
            }
        }
        return blogSearchTools.searchArticles(content, limit);
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
                .matchSource("related")
                .build();
    }
}
