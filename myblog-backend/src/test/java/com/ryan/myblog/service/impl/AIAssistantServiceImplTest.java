package com.ryan.myblog.service.impl;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CategoryService;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import com.ryan.myblog.service.TagService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class AIAssistantServiceImplTest {

    @Mock
    private BlogService blogService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private TagService tagService;

    @Mock
    private CacheService cacheService;

    @Mock
    private OpenAiRuntimeConfigService openAiRuntimeConfigService;

    @Test
    void generalQuestionDoesNotInjectBlogContext() {
        AIAssistantServiceImpl service = newService();

        String prompt = ReflectionTestUtils.invokeMethod(
                service,
                "buildChatPrompt",
                "Java Stream 的 map 和 flatMap 有什么区别？",
                "最新文章：\n- 《只应该在站内问题出现的文章》",
                List.of());

        assertTrue(prompt.contains("技术助手"));
        assertTrue(prompt.contains("只回答技术"));
        assertTrue(prompt.contains("不要强行关联博客内容"));
        assertFalse(prompt.contains("MyBlog站内信息"));
        assertFalse(prompt.contains("只应该在站内问题出现的文章"));
    }

    @Test
    void offTopicQuestionIsRejectedBeforeModelAndBlogContext() {
        AIAssistantServiceImpl service = newService();
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("今天天气怎么样？");

        AIChatResponse response = service.chat(request);

        assertTrue(response.getAnswer().contains("超出了当前助手范围"));
        assertFalse(response.getAiEnabled());
        verifyNoInteractions(blogService, categoryService, tagService, cacheService);
    }

    @Test
    void greetingQuestionReturnsAssistantIntroWithoutModelAndBlogContext() {
        AIAssistantServiceImpl service = newService();
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("你好");

        AIChatResponse response = service.chat(request);

        assertTrue(response.getAnswer().contains("我是 MyBlog 的 AI 助手"));
        assertTrue(response.getAnswer().contains("我可以帮你"));
        assertFalse(response.getAiEnabled());
        verifyNoInteractions(blogService, categoryService, tagService, cacheService);
    }

    @Test
    void capabilityQuestionReturnsAssistantIntroWithoutModelAndBlogContext() {
        AIAssistantServiceImpl service = newService();
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("你可以做什么？");

        AIChatResponse response = service.chat(request);

        assertTrue(response.getAnswer().contains("技术、编程、软件工程"));
        assertTrue(response.getAnswer().contains("天气、生活闲聊"));
        assertFalse(response.getAiEnabled());
        verifyNoInteractions(blogService, categoryService, tagService, cacheService);
    }

    @Test
    void blogQuestionInjectsBlogContextWithArticleConstraint() {
        AIAssistantServiceImpl service = newService();

        String prompt = ReflectionTestUtils.invokeMethod(
                service,
                "buildChatPrompt",
                "推荐几篇站内文章",
                "最新文章：\n- 《Spring AI 实践》",
                List.of());

        assertTrue(prompt.contains("MyBlog站内信息"));
        assertTrue(prompt.contains("只能使用"));
        assertTrue(prompt.contains("Spring AI 实践"));
    }

    @Test
    void technicalQuestionIsSupportedWithoutBlogScope() {
        AIAssistantServiceImpl service = newService();

        Boolean supported = ReflectionTestUtils.invokeMethod(
                service,
                "isSupportedQuestion",
                "Java Stream 的 map 和 flatMap 有什么区别？");
        Boolean blogScoped = ReflectionTestUtils.invokeMethod(
                service,
                "isBlogScopedQuestion",
                "Java Stream 的 map 和 flatMap 有什么区别？");

        assertTrue(Boolean.TRUE.equals(supported));
        assertFalse(Boolean.TRUE.equals(blogScoped));
    }

    private AIAssistantServiceImpl newService() {
        return new AIAssistantServiceImpl(
                blogService,
                categoryService,
                tagService,
                cacheService,
                openAiRuntimeConfigService);
    }
}
