package com.ryan.myblog.ai.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class ContentTools {

    private static final int CONTENT_MAX_CHARS = 8000;

    private final TagService tagService;
    private final AiObservabilityService observabilityService;
    private final ObjectMapper objectMapper;

    @Tool(description = "Generate a concise Chinese summary for article content.")
    public String summarizeArticle(String content, String style) {
        return ToolSupport.observe("summarizeArticle", Map.of("style", safe(style), "contentChars", length(content)),
                observabilityService, objectMapper, () -> doSummarizeArticle(content));
    }

    @Tool(description = "Recommend MyBlog tags for article content. Existing tags are preferred, new tag suggestions are allowed.")
    public List<TagRecommendationResult> recommendTags(String content) {
        return ToolSupport.observe("recommendTags", Map.of("contentChars", length(content)),
                observabilityService, objectMapper, () -> doRecommendTags(content));
    }

    private String doSummarizeArticle(String content) {
        String normalized = normalize(content);
        if (normalized.length() <= 220) {
            return normalized;
        }
        String[] sentences = normalized.split("(?<=[。！？.!?])");
        StringBuilder summary = new StringBuilder();
        for (String sentence : sentences) {
            if (summary.length() + sentence.length() > 220) {
                break;
            }
            summary.append(sentence.trim());
        }
        if (summary.length() < 80) {
            summary.append(normalized, 0, Math.min(normalized.length(), 180));
        }
        return summary.toString().trim();
    }

    private List<TagRecommendationResult> doRecommendTags(String content) {
        String normalized = normalize(content).toLowerCase(Locale.ROOT);
        List<Tag> existingTags = tagService.getAllTags();
        Map<String, TagRecommendationResult> results = new LinkedHashMap<>();
        for (Tag tag : existingTags) {
            String name = tag.getName();
            if (!hasText(name)) {
                continue;
            }
            String lower = name.toLowerCase(Locale.ROOT);
            if (normalized.contains(lower)) {
                results.put(lower, TagRecommendationResult.builder()
                        .id(tag.getId())
                        .name(name)
                        .color(tag.getColor())
                        .existing(true)
                        .confidence(0.95d)
                        .reason("文章内容直接出现该站内标签")
                        .build());
            }
        }

        for (String keyword : extractKeywords(normalized)) {
            results.putIfAbsent(keyword.toLowerCase(Locale.ROOT), TagRecommendationResult.builder()
                    .name(keyword)
                    .existing(false)
                    .confidence(0.68d)
                    .reason("根据文章高频技术词建议的新标签")
                    .build());
        }

        return results.values().stream()
                .sorted(Comparator.comparing(TagRecommendationResult::getConfidence).reversed())
                .limit(8)
                .toList();
    }

    private List<String> extractKeywords(String content) {
        List<String> keywords = new ArrayList<>();
        java.util.regex.Matcher matcher = Pattern.compile("[a-z][a-z0-9+#.\\-]{2,24}|[\\p{IsHan}]{2,8}")
                .matcher(content);
        while (matcher.find() && keywords.size() < 12) {
            String token = matcher.group().trim();
            if (!isNoise(token) && keywords.stream().noneMatch(item -> item.equalsIgnoreCase(token))) {
                keywords.add(token);
            }
        }
        return keywords;
    }

    private static String normalize(String content) {
        return ToolSupport.truncate(content == null ? "" : content, CONTENT_MAX_CHARS)
                .replaceAll("(?s)```.*?```", " ")
                .replaceAll("[#>*_`~\\[\\]()]+" , " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private static boolean isNoise(String token) {
        return token.length() < 2 || java.util.Set.of("这个", "那个", "我们", "可以", "进行", "通过", "使用",
                "the", "and", "for", "with", "http", "https", "www", "com").contains(token);
    }

    private static int length(String value) {
        return value == null ? 0 : value.length();
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
