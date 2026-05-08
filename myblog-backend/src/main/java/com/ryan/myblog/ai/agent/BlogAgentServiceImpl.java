package com.ryan.myblog.ai.agent;

import com.ryan.myblog.ai.memory.AiConversationMemoryService;
import com.ryan.myblog.ai.observability.AiObservabilityService;
import com.ryan.myblog.ai.observability.AiToolExecutionContext;
import com.ryan.myblog.ai.prompt.PromptTemplateService;
import com.ryan.myblog.ai.tool.ArticleToolResult;
import com.ryan.myblog.ai.tool.BlogSearchTools;
import com.ryan.myblog.ai.tool.ContentTools;
import com.ryan.myblog.ai.tool.RecommendationTools;
import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.model.entity.AiMessage;
import com.ryan.myblog.service.AiAction;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import com.ryan.myblog.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BlogAgentServiceImpl implements BlogAgentService {

    private static final int HISTORY_MESSAGE_MAX_CHARS = 500;
    private static final int RELATED_ARTICLE_LIMIT = 4;

    private final OpenAiRuntimeConfigService openAiRuntimeConfigService;
    private final PromptTemplateService promptTemplateService;
    private final AiConversationMemoryService memoryService;
    private final AiObservabilityService observabilityService;
    private final BlogSearchTools blogSearchTools;
    private final ContentTools contentTools;
    private final RecommendationTools recommendationTools;

    @Override
    public boolean isAvailable() {
        return openAiRuntimeConfigService.isAiAvailable();
    }

    @Override
    public AIChatResponse chat(AIChatRequest request) {
        long start = System.currentTimeMillis();
        String requestId = "agent-chat-" + UUID.randomUUID().toString().substring(0, 8);
        Long userId = SecurityUtils.getCurrentUserId();
        var systemTemplate = promptTemplateService.getTemplate("agent.system");
        var chatTemplate = promptTemplateService.getTemplate("chat.general");
        AiConversationMemoryService.ConversationContext context = memoryService.loadOrCreate(
                request.getConversationId(), userId, request.getQuestion());
        AiMessage userMessage = memoryService.appendMessage(context.conversationId(), "user", request.getQuestion());
        AiToolExecutionContext.Context toolContext = new AiToolExecutionContext.Context(
                context.conversationId(), userId, userMessage.getId());

        String prompt = buildPrompt(chatTemplate.content(), context, request);
        String answer = null;
        try {
            ChatClient chatClient = openAiRuntimeConfigService.getChatClient();
            if (chatClient == null) {
                throw new IllegalStateException("AI模型尚未初始化");
            }
            AiToolExecutionContext.set(toolContext);
            String rawAnswer = chatClient.prompt()
                    .options(openAiRuntimeConfigService.getChatOptions(AiAction.CHAT))
                    .system(systemTemplate.content())
                    .user(prompt)
                    .tools(blogSearchTools, contentTools, recommendationTools)
                    .call()
                    .content();
            answer = sanitize(rawAnswer);
            memoryService.appendMessage(context.conversationId(), "assistant", answer);
            memoryService.refreshConversation(context.conversationId(), answer);
            observabilityService.recordRequest(new AiObservabilityService.AiRequestEvent(
                    requestId,
                    context.conversationId(),
                    userId,
                    "chat",
                    "success",
                    systemTemplate.key(),
                    systemTemplate.version(),
                    openAiRuntimeConfigService.getConfig().getModel(),
                    prompt.length(),
                    answer.length(),
                    toolContext.toolCallCount(),
                    System.currentTimeMillis() - start,
                    null));
            return AIChatResponse.builder()
                    .answer(answer)
                    .conversationId(context.conversationId())
                    .aiEnabled(true)
                    .responseTime(System.currentTimeMillis() - start)
                    .relatedArticles(findRelatedArticles(request.getQuestion()))
                    .build();
        } catch (Exception e) {
            log.warn("AI Agent模型调用失败，使用站内工具检索降级回答 conversationId={} error={}",
                    context.conversationId(), e.getMessage());
            AIChatResponse fallbackResponse = buildToolFallbackResponse(
                    request,
                    context,
                    userId,
                    requestId,
                    systemTemplate.key(),
                    systemTemplate.version(),
                    prompt.length(),
                    toolContext,
                    start,
                    e);
            observabilityService.recordRequest(new AiObservabilityService.AiRequestEvent(
                    requestId,
                    context.conversationId(),
                    userId,
                    "chat",
                    "fallback",
                    systemTemplate.key(),
                    systemTemplate.version(),
                    openAiRuntimeConfigService.getConfig().getModel(),
                    prompt.length(),
                    fallbackResponse.getAnswer() != null ? fallbackResponse.getAnswer().length() : 0,
                    toolContext.toolCallCount(),
                    System.currentTimeMillis() - start,
                    e.getMessage()));
            return fallbackResponse;
        } finally {
            AiToolExecutionContext.clear();
        }
    }

    private AIChatResponse buildToolFallbackResponse(AIChatRequest request,
                                                     AiConversationMemoryService.ConversationContext context,
                                                     Long userId,
                                                     String requestId,
                                                     String promptKey,
                                                     String promptVersion,
                                                     int promptChars,
                                                     AiToolExecutionContext.Context toolContext,
                                                     long start,
                                                     Exception modelError) {
        try {
            List<ArticleToolResult> articles = blogSearchTools.searchArticles(
                    request.getQuestion(),
                    Math.max(RELATED_ARTICLE_LIMIT, openAiRuntimeConfigService.getRagTopK()));
            String fallbackAnswer = buildArticleRecommendationAnswer(articles);
            memoryService.appendMessage(context.conversationId(), "assistant", fallbackAnswer);
            memoryService.refreshConversation(context.conversationId(), fallbackAnswer);
            return AIChatResponse.builder()
                    .answer(fallbackAnswer)
                    .conversationId(context.conversationId())
                    .aiEnabled(true)
                    .responseTime(System.currentTimeMillis() - start)
                    .relatedArticles(articles.stream().map(this::toRelatedArticle).toList())
                    .build();
        } catch (Exception fallbackError) {
            observabilityService.recordRequest(new AiObservabilityService.AiRequestEvent(
                    requestId,
                    context.conversationId(),
                    userId,
                    "chat",
                    "error",
                    promptKey,
                    promptVersion,
                    openAiRuntimeConfigService.getConfig().getModel(),
                    promptChars,
                    0,
                    toolContext.toolCallCount(),
                    System.currentTimeMillis() - start,
                    modelError.getMessage() + "; fallback=" + fallbackError.getMessage()));
            throw new RuntimeException("AI Agent服务暂时不可用，请稍后再试", modelError);
        }
    }

    private String buildArticleRecommendationAnswer(List<ArticleToolResult> articles) {
        if (articles == null || articles.isEmpty()) {
            return "我暂时没有检索到足够匹配的站内文章。可以换一个关键词，或者从技术分享、项目实战分类里继续筛选。";
        }
        StringBuilder answer = new StringBuilder("我在站内检索到这些相关文章：\n");
        for (int i = 0; i < articles.size(); i++) {
            ArticleToolResult article = articles.get(i);
            answer.append(i + 1).append(". ").append(article.getTitle());
            String tags = tagNames(article);
            if (hasText(tags)) {
                answer.append("（").append(tags).append("）");
            }
            String reason = articleReason(article);
            if (hasText(reason)) {
                answer.append("\n   ").append(reason);
            }
            if (i < articles.size() - 1) {
                answer.append("\n");
            }
        }
        return answer.toString();
    }

    private String tagNames(ArticleToolResult article) {
        if (article == null || article.getTags() == null || article.getTags().isEmpty()) {
            return "";
        }
        return article.getTags().stream()
                .map(tag -> tag.getName())
                .filter(BlogAgentServiceImpl::hasText)
                .collect(Collectors.joining("、"));
    }

    private String articleReason(ArticleToolResult article) {
        if (article == null) {
            return "";
        }
        String source = hasText(article.getSummary()) ? article.getSummary() : article.getSnippet();
        if (!hasText(source)) {
            return "";
        }
        return truncate(cleanArticleSnippet(source), 120);
    }

    private static String cleanArticleSnippet(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\\n", " ")
                .replaceAll("(?m)^标题：.*?(?:\\n|$)", "")
                .replaceAll("(?m)^摘要：", "")
                .replaceAll("(?m)^分类：.*?(?:\\n|$)", "")
                .replaceAll("(?m)^标签：.*?(?:\\n|$)", "")
                .replaceAll("(?m)^正文片段：", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String buildPrompt(String instruction,
                               AiConversationMemoryService.ConversationContext context,
                               AIChatRequest request) {
        StringBuilder prompt = new StringBuilder(instruction).append("\n\n");
        if (hasText(context.summary())) {
            prompt.append("【会话摘要】\n").append(context.summary()).append("\n\n");
        }
        if (context.recentMessages() != null && !context.recentMessages().isEmpty()) {
            prompt.append("【服务端会话历史】\n");
            for (AiMessage message : context.recentMessages()) {
                prompt.append(roleLabel(message.getRole()))
                        .append(": ")
                        .append(truncate(message.getContent(), HISTORY_MESSAGE_MAX_CHARS))
                        .append("\n");
            }
            prompt.append("\n");
        }
        if (request.getHistory() != null && !request.getHistory().isEmpty()) {
            prompt.append("【客户端补充历史】\n");
            int start = Math.max(0, request.getHistory().size() - 8);
            for (AIChatRequest.ChatMessage message : request.getHistory().subList(start, request.getHistory().size())) {
                prompt.append(roleLabel(message.getRole()))
                        .append(": ")
                        .append(truncate(message.getContent(), HISTORY_MESSAGE_MAX_CHARS))
                        .append("\n");
            }
            prompt.append("\n");
        }
        prompt.append("【当前问题】\n").append(request.getQuestion());
        return prompt.toString();
    }

    private List<AIChatResponse.RelatedArticle> findRelatedArticles(String question) {
        try {
            return blogSearchTools.searchArticles(question, RELATED_ARTICLE_LIMIT).stream()
                    .map(this::toRelatedArticle)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.debug("Agent相关文章检索失败: {}", e.getMessage());
            return List.of();
        }
    }

    private AIChatResponse.RelatedArticle toRelatedArticle(ArticleToolResult result) {
        return AIChatResponse.RelatedArticle.builder()
                .id(result.getId())
                .publicId(result.getPublicId())
                .title(result.getTitle())
                .categoryId(result.getCategoryId())
                .categoryName(result.getCategoryName())
                .tags(result.getTags())
                .publishTime(result.getPublishTime())
                .snippet(result.getSnippet())
                .score(result.getScore())
                .build();
    }

    private static String roleLabel(String role) {
        return "assistant".equals(role) ? "助手" : "用户";
    }

    private static String sanitize(String raw) {
        return raw == null ? "" : raw.replaceAll("(?is)<\\s*(?:think|thinking)\\b[^>]*>.*?<\\s*/\\s*(?:think|thinking)\\s*>", "")
                .replaceAll("(?is)</?\\s*(?:think|thinking)\\b[^>]*>", "")
                .trim();
    }

    private static String truncate(String text, int maxChars) {
        if (text == null || text.length() <= maxChars) {
            return text;
        }
        return text.substring(0, maxChars);
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
