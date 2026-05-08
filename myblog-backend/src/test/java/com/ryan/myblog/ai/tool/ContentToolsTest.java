package com.ryan.myblog.ai.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.service.TagService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ContentToolsTest {

    @Test
    void recommendTagsPrefersExistingTagsAndAddsNewCandidates() {
        TagService tagService = mock(TagService.class);
        AiObservabilityService observabilityService = mock(AiObservabilityService.class);
        Tag springAi = new Tag();
        springAi.setId(1L);
        springAi.setName("Spring AI");
        springAi.setColor("#111827");
        when(tagService.getAllTags()).thenReturn(List.of(springAi));

        ContentTools tools = new ContentTools(tagService, observabilityService, new ObjectMapper());

        List<TagRecommendationResult> results = tools.recommendTags("使用 Spring AI 构建 Agent 和 Tool Calling 能力。");

        assertFalse(results.isEmpty());
        assertTrue(results.stream().anyMatch(item -> Boolean.TRUE.equals(item.getExisting()) && "Spring AI".equals(item.getName())));
        assertTrue(results.stream().anyMatch(item -> Boolean.FALSE.equals(item.getExisting())));
    }
}
