package com.ryan.myblog.service.impl;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.model.vo.RagSearchResult;
import com.ryan.myblog.ai.agent.BlogAgentService;
import com.ryan.myblog.service.AIAssistantService;
import com.ryan.myblog.service.AiAction;
import com.ryan.myblog.service.AiStreamLifecycle;
import com.ryan.myblog.service.BlogRagService;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CategoryService;
import com.ryan.myblog.service.OpenAiRuntimeConfigService;
import com.ryan.myblog.service.TagService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * AI智能助手服务实现。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIAssistantServiceImpl implements AIAssistantService {

        private static final Pattern THINK_BLOCK_PATTERN = Pattern.compile(
                        "(?is)<\\s*(?:think|thinking)\\b[^>]*>.*?<\\s*/\\s*(?:think|thinking)\\s*>");
        private static final Pattern THINK_TAG_PATTERN = Pattern.compile(
                        "(?is)</?\\s*(?:think|thinking)\\b[^>]*>");

        private static final int CHAT_HISTORY_LIMIT = 10;
        private static final int CHAT_HISTORY_MESSAGE_MAX_CHARS = 300;
        private static final int SUMMARY_MAX_CONTENT_CHARS = 3000;
        private static final int POLISH_MAX_CONTENT_CHARS = 5000;
        private static final int TAGS_IN_CONTEXT_LIMIT = 40;
        private static final int RELATED_ARTICLES_SCAN_LIMIT = 50;
        private static final int CHAT_CACHE_TTL_SECONDS = 300;
        private static final int DEFAULT_CACHE_TTL_SECONDS = 60 * 60 * 24;
        private static final String CHAT_PROMPT_VERSION = "v3";
        private static final String OUT_OF_SCOPE_ANSWER = "我只能回答和 MyBlog、技术、编程、软件工程、AI 使用或技术写作相关的问题。这个问题超出了当前助手范围。";
        private static final long CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000L;
        private static final long RELATED_ARTICLES_CACHE_TTL_MS = 5 * 60 * 1000L;
        private static final long SSE_TIMEOUT_MS = 60_000L;

        private final BlogService blogService;
        private final BlogAgentService blogAgentService;
        private final BlogRagService blogRagService;
        private final CategoryService categoryService;
        private final TagService tagService;
        private final com.ryan.myblog.service.CacheService cacheService;
        private final OpenAiRuntimeConfigService openAiRuntimeConfigService;

        private volatile String cachedBlogContext;
        private volatile long blogContextExpiresAt = 0L;
        private volatile List<BlogListVO> cachedRelatedArticleCandidates = java.util.Collections.emptyList();
        private volatile long relatedArticleCandidatesExpiresAt = 0L;

        @jakarta.annotation.PostConstruct
        public void logAIConfig() {
                var config = openAiRuntimeConfigService.getConfig();
                log.info("AIAssistantService配置: aiEnabled={}, apiKeyConfigured={}, available={}, baseUrl={}, model={}",
                                config.getAiEnabled(),
                                config.getApiKeyConfigured(),
                                config.getAvailable(),
                                config.getBaseUrl(),
                                config.getModel());
        }

        @Override
        public AIChatResponse chat(AIChatRequest request) {
                String requestId = newRequestId(AiAction.CHAT);
                long totalStart = System.currentTimeMillis();

                try {
                        if (isAssistantMetaQuestion(request.getQuestion())) {
                                String answer = buildAssistantCapabilityAnswer();
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, 0, -1, -1, 0,
                                                elapsed(totalStart), answer.length());
                                return buildChatResponse(request, answer, false, totalStart, List.of());
                        }

                        if (!isSupportedQuestion(request.getQuestion())) {
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, 0, -1, -1, 0,
                                                elapsed(totalStart), OUT_OF_SCOPE_ANSWER.length());
                                return buildChatResponse(request, OUT_OF_SCOPE_ANSWER, false, totalStart, List.of());
                        }

                        if (blogAgentService.isAvailable()) {
                                try {
                                        return blogAgentService.chat(request);
                                } catch (Exception e) {
                                        log.warn("AI Agent处理失败，回退旧问答链路: {}", e.getMessage());
                                }
                        }

                        long contextStart = System.currentTimeMillis();
                        String context = buildContext();
                        long contextMs = elapsed(contextStart);

                        if (!isAIAvailable()) {
                                String answer = handleWithRules(request.getQuestion(), context);
                                List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, contextMs, -1, -1, 0, elapsed(totalStart), answer.length());
                                return buildChatResponse(request, answer, false, totalStart, relatedArticles);
                        }

                        List<RagSearchResult> ragResults = searchRag(request.getQuestion());
                        String effectiveContext = mergeRagContext(context, ragResults);
                        String chatCacheKey = buildChatCacheKey(request.getQuestion(), request.getHistory(), effectiveContext);
                        String cachedAnswer = getCachedValue(chatCacheKey, CHAT_CACHE_TTL_SECONDS);
                        if (cachedAnswer != null) {
                                List<AIChatResponse.RelatedArticle> relatedArticles = relatedArticlesForAnswer(ragResults, cachedAnswer);
                                logAiSuccess(requestId, AiAction.CHAT, 0, true, contextMs, -1, -1, 0, elapsed(totalStart), cachedAnswer.length());
                                return buildChatResponse(request, cachedAnswer, true, totalStart, relatedArticles);
                        }

                        String prompt = buildChatPrompt(request.getQuestion(), context, request.getHistory(), ragResults);
                        String answer = callAI(AiAction.CHAT, prompt, requestId, contextMs, totalStart);
                        cacheValue(chatCacheKey, answer, CHAT_CACHE_TTL_SECONDS);
                        List<AIChatResponse.RelatedArticle> relatedArticles = relatedArticlesForAnswer(ragResults, answer);
                        return buildChatResponse(request, answer, true, totalStart, relatedArticles);

                } catch (Exception e) {
                        log.error("AI助手处理失败 requestId={} action={} totalMs={}", requestId, AiAction.CHAT, elapsed(totalStart), e);
                        String context = buildContext();
                        String answer = handleWithRules(request.getQuestion(), context);
                        List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                        return buildChatResponse(request, answer, false, totalStart, relatedArticles);
                }
        }

        @Override
        public SseEmitter streamChat(AIChatRequest request, AiStreamLifecycle lifecycle) {
                SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
                String requestId = newRequestId(AiAction.CHAT);
                emitter.onTimeout(lifecycle::onServiceFailure);
                emitter.onError(error -> lifecycle.onSuccess());
                CompletableFuture.runAsync(() -> streamChatInternal(request, emitter, requestId, lifecycle));
                return emitter;
        }

        private void streamChatInternal(AIChatRequest request, SseEmitter emitter, String requestId,
                                        AiStreamLifecycle lifecycle) {
                long totalStart = System.currentTimeMillis();
                long contextMs = -1L;
                int promptChars = 0;
                boolean cacheHit = false;

                try {
                        sendSse(emitter, "status", Map.of("message", "正在理解问题..."));

                        if (isAssistantMetaQuestion(request.getQuestion())) {
                                String answer = buildAssistantCapabilityAnswer();
                                lifecycle.onSuccess();
                                sendAnswerChunks(emitter, answer);
                                sendDone(emitter, request, totalStart, false, false);
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, 0, -1, -1, 0,
                                                elapsed(totalStart), answer.length());
                                return;
                        }

                        if (!isSupportedQuestion(request.getQuestion())) {
                                lifecycle.onSuccess();
                                sendSse(emitter, "status", Map.of("message", "这个问题超出助手范围"));
                                sendAnswerChunks(emitter, OUT_OF_SCOPE_ANSWER);
                                sendDone(emitter, request, totalStart, false, false);
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, 0, -1, -1, 0,
                                                elapsed(totalStart), OUT_OF_SCOPE_ANSWER.length());
                                return;
                        }

                        if (blogAgentService.isAvailable()) {
                                try {
                                        sendSse(emitter, "status", Map.of("message", "正在调用站内工具..."));
                                        AIChatResponse response = blogAgentService.chat(request);
                                        lifecycle.onSuccess();
                                        sendAnswerChunks(emitter, response.getAnswer());
                                        if (response.getRelatedArticles() != null && !response.getRelatedArticles().isEmpty()) {
                                                sendSse(emitter, "relatedArticles", Map.of("items", response.getRelatedArticles()));
                                        }
                                        sendDone(emitter, requestWithConversationId(request, response.getConversationId()),
                                                        totalStart, false, true);
                                        return;
                                } catch (Exception e) {
                                        log.warn("AI Agent流式处理失败，回退旧问答链路: {}", e.getMessage());
                                }
                        }

                        long contextStart = System.currentTimeMillis();
                        String context = buildContext();
                        contextMs = elapsed(contextStart);

                        if (!isAIAvailable()) {
                                String answer = handleWithRules(request.getQuestion(), context);
                                lifecycle.onSuccess();
                                sendAnswerChunks(emitter, answer);
                                sendRelatedArticles(emitter, answer);
                                sendDone(emitter, request, totalStart, false, false);
                                logAiSuccess(requestId, AiAction.CHAT, 0, false, contextMs, -1, -1, 0,
                                                elapsed(totalStart), answer.length());
                                return;
                        }

                        List<RagSearchResult> ragResults = searchRag(request.getQuestion());
                        String effectiveContext = mergeRagContext(context, ragResults);
                        String chatCacheKey = buildChatCacheKey(request.getQuestion(), request.getHistory(), effectiveContext);
                        String cachedAnswer = getCachedValue(chatCacheKey, CHAT_CACHE_TTL_SECONDS);
                        if (cachedAnswer != null) {
                                cacheHit = true;
                                lifecycle.onSuccess();
                                sendSse(emitter, "status", Map.of("message", "已命中缓存，正在整理回答..."));
                                sendAnswerChunks(emitter, cachedAnswer);
                                sendRelatedArticles(emitter, ragResults, cachedAnswer);
                                sendDone(emitter, request, totalStart, true, true);
                                logAiSuccess(requestId, AiAction.CHAT, 0, true, contextMs, -1, -1, 0, elapsed(totalStart), cachedAnswer.length());
                                return;
                        }

                        sendSse(emitter, "status", Map.of("message", "正在生成回答..."));
                        String prompt = buildChatPrompt(request.getQuestion(), context, request.getHistory(), ragResults);
                        promptChars = prompt.length();
                        StreamResult streamResult = streamAI(AiAction.CHAT, prompt, requestId, contextMs, totalStart, emitter);
                        String answer = ensureNonBlankAiResult(streamResult.answer(), "聊天回复");
                        cacheValue(chatCacheKey, answer, CHAT_CACHE_TTL_SECONDS);
                        lifecycle.onSuccess();
                        sendRelatedArticles(emitter, ragResults, answer);
                        sendDone(emitter, request, totalStart, false, true);

                } catch (Exception e) {
                        log.error("AI流式调用失败 requestId={} action={} promptChars={} cacheHit={} contextMs={} totalMs={}",
                                        requestId, AiAction.CHAT, promptChars, cacheHit, contextMs, elapsed(totalStart), e);
                        if (isSseTransportFailure(e)) {
                                lifecycle.onSuccess();
                        } else {
                                lifecycle.onServiceFailure();
                        }
                        try {
                                sendSse(emitter, "error", Map.of("message", "AI服务暂时不可用，请稍后再试"));
                                emitter.complete();
                        } catch (Exception sendError) {
                                emitter.completeWithError(sendError);
                        }
                }
        }

        private boolean isSseTransportFailure(Throwable error) {
                Throwable current = error;
                while (current != null) {
                        if (current instanceof IOException || "SSE发送失败".equals(current.getMessage())) {
                                return true;
                        }
                        current = current.getCause();
                }
                return false;
        }

        @Override
        public String getIntroduction() {
                return buildAssistantCapabilityAnswer();
        }

        private String buildContext() {
                long now = System.currentTimeMillis();
                if (cachedBlogContext != null && now < blogContextExpiresAt) {
                        return cachedBlogContext;
                }

                synchronized (this) {
                        now = System.currentTimeMillis();
                        if (cachedBlogContext != null && now < blogContextExpiresAt) {
                                return cachedBlogContext;
                        }
                        String freshContext = doBuildContext();
                        cachedBlogContext = freshContext;
                        blogContextExpiresAt = now + CONTEXT_CACHE_TTL_MS;
                        return freshContext;
                }
        }

        private String doBuildContext() {
                StringBuilder context = new StringBuilder();

                List<Category> categories = categoryService.getAllCategoriesWithCount();
                context.append("博客分类：\n");
                categories.forEach(cat -> context.append("- ").append(cat.getName())
                                .append(": ").append(cat.getDescription()).append("\n"));

                List<Tag> tags = tagService.getAllTags();
                context.append("\n技术标签：\n");
                context.append(tags.stream()
                                .limit(TAGS_IN_CONTEXT_LIMIT)
                                .map(Tag::getName)
                                .collect(Collectors.joining("、")));

                List<BlogListVO> recentBlogs = blogService.getRecentBlogs(5);
                context.append("\n\n最新文章：\n");
                recentBlogs.forEach(blog -> context.append("- 《").append(blog.getTitle()).append("》\n"));

                List<BlogDetailVO> hotBlogsDetail = blogService.getHotBlogs(5);
                List<BlogListVO> hotBlogs = hotBlogsDetail.stream()
                                .map(blog -> {
                                        BlogListVO vo = new BlogListVO();
                                        vo.setId(blog.getId());
                                        vo.setTitle(blog.getTitle());
                                        vo.setViewCount(blog.getViewCount() != null ? blog.getViewCount().longValue() : 0L);
                                        return vo;
                                })
                                .collect(Collectors.toList());
                context.append("\n热门文章：\n");
                hotBlogs.forEach(blog -> context.append("- 《").append(blog.getTitle())
                                .append("》 (").append(blog.getViewCount()).append("次阅读)\n"));

                context.append("\n技术栈：\n");
                context.append("后端：Spring Boot 3.5 + MyBatis Plus + MySQL + Redis + Elasticsearch\n");
                context.append("前端：React 19 + TypeScript + Vite + TailwindCSS\n");
                context.append("部署：Docker + Nginx\n");

                return context.toString();
        }

        private String buildChatPrompt(String question, String context, List<AIChatRequest.ChatMessage> history,
                        List<RagSearchResult> ragResults) {
                StringBuilder historyContext = new StringBuilder();
                if (history != null && !history.isEmpty()) {
                        int startIndex = Math.max(0, history.size() - CHAT_HISTORY_LIMIT);
                        List<AIChatRequest.ChatMessage> effectiveHistory = history.subList(startIndex, history.size());
                        historyContext.append("【对话历史】\n");
                        for (AIChatRequest.ChatMessage msg : effectiveHistory) {
                                String roleLabel = "user".equals(msg.getRole()) ? "用户" : "助手";
                                historyContext.append(roleLabel)
                                                .append(": ")
                                                .append(truncateContent(msg.getContent(), CHAT_HISTORY_MESSAGE_MAX_CHARS))
                                                .append("\n");
                        }
                        historyContext.append("\n");
                }

                String ragContext = buildRagContext(ragResults);
                if (!ragContext.isBlank()) {
                        return String.format(
                                        "你是MyBlog站点内的技术助手。请优先基于【站内文章片段】回答用户问题。\n" +
                                                        "规则：只能把片段中出现的文章作为站内依据；不要编造文章、阅读量、日期或作者。" +
                                                        "如果片段不足以回答，先说明依据有限，再给出通用技术建议。不要输出思考过程。\n\n" +
                                                        "【站内文章片段】\n%s\n\n%s【用户问题】%s",
                                        ragContext, historyContext, question);
                }

                if (!isBlogScopedQuestion(question)) {
                        return String.format(
                                        "你是MyBlog站点内的技术助手。请直接、简洁、有帮助地回答。\n" +
                                                        "只回答技术、编程、软件工程、AI使用或技术写作相关问题；不要强行关联博客内容。\n" +
                                                        "如果用户转向天气、生活、娱乐、情感、金融、医疗、法律等非技术话题，请简短说明超出当前助手范围。\n" +
                                                        "不要输出思考过程。\n\n%s【用户问题】%s",
                                        historyContext, question);
                }

                return String.format(
                                "你是MyBlog站点内的通用AI助手。当前问题需要使用站内信息辅助回答。\n" +
                                                "规则：推荐、引用或评价具体文章时，只能使用【MyBlog站内信息】中出现的文章；不要编造文章、阅读量、日期或作者。" +
                                                "如果站内信息不足，先说明不足，再给出通用建议。不要输出思考过程。\n\n" +
                                                "【MyBlog站内信息】\n%s\n\n%s【用户问题】%s",
                                context, historyContext, question);
        }

        private List<RagSearchResult> searchRag(String question) {
                try {
                        return blogRagService.search(question,
                                        openAiRuntimeConfigService.getRagTopK(),
                                        openAiRuntimeConfigService.getRagSimilarityThreshold());
                } catch (Exception e) {
                        log.warn("RAG检索异常，继续普通问答: {}", e.getMessage());
                        return List.of();
                }
        }

        private String mergeRagContext(String context, List<RagSearchResult> ragResults) {
                String ragContext = buildRagContext(ragResults);
                return ragContext.isBlank() ? context : context + "\n\nRAG片段：\n" + ragContext;
        }

        private String buildRagContext(List<RagSearchResult> ragResults) {
                if (ragResults == null || ragResults.isEmpty()) {
                        return "";
                }
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < ragResults.size(); i++) {
                        RagSearchResult result = ragResults.get(i);
                        builder.append(i + 1)
                                        .append(". 《").append(result.getTitle()).append("》")
                                        .append(formatRagMetadata(result))
                                        .append("：").append(truncateContent(result.getSnippet(), 700))
                                        .append("\n");
                }
                return builder.toString().trim();
        }

        private boolean isSupportedQuestion(String question) {
                return isAssistantMetaQuestion(question) || isBlogScopedQuestion(question) || isTechnicalQuestion(question);
        }

        private boolean isAssistantMetaQuestion(String question) {
                if (question == null || question.isBlank()) {
                        return false;
                }
                String text = question.trim().toLowerCase();
                return text.matches("^(你好|您好|哈喽|hello|hi|hey|在吗|在不在)[！!。,.，\\s]*$")
                                || text.contains("你可以做什么")
                                || text.contains("你能做什么")
                                || text.contains("你会做什么")
                                || text.contains("你有什么功能")
                                || text.contains("你是谁")
                                || text.contains("介绍一下你")
                                || text.contains("怎么用你")
                                || text.contains("帮助")
                                || text.contains("help")
                                || text.contains("what can you do")
                                || text.contains("who are you");
        }

        private boolean isBlogScopedQuestion(String question) {
                if (question == null || question.isBlank()) {
                        return false;
                }
                String text = question.toLowerCase();
                return text.contains("myblog")
                                || text.contains("博客")
                                || text.contains("文章")
                                || text.contains("站内")
                                || text.contains("本站")
                                || text.contains("这个站")
                                || text.contains("这个网站")
                                || text.contains("这个项目")
                                || text.contains("分类")
                                || text.contains("标签")
                                || text.contains("推荐")
                                || text.contains("热门")
                                || text.contains("阅读量")
                                || text.contains("技术栈")
                                || text.contains("作者")
                                || text.contains("blog")
                                || text.contains("article")
                                || text.contains("post")
                                || text.contains("category")
                                || text.contains("tag");
        }

        private boolean isTechnicalQuestion(String question) {
                if (question == null || question.isBlank()) {
                        return false;
                }
                String text = question.toLowerCase();
                return text.contains("技术")
                                || text.contains("编程")
                                || text.contains("代码")
                                || text.contains("开发")
                                || text.contains("软件")
                                || text.contains("工程")
                                || text.contains("架构")
                                || text.contains("前端")
                                || text.contains("后端")
                                || text.contains("数据库")
                                || text.contains("算法")
                                || text.contains("接口")
                                || text.contains("部署")
                                || text.contains("性能")
                                || text.contains("缓存")
                                || text.contains("日志")
                                || text.contains("测试")
                                || text.contains("模型")
                                || text.contains("提示词")
                                || text.contains("报错")
                                || text.contains("bug")
                                || text.contains("api")
                                || text.contains("java")
                                || text.contains("spring")
                                || text.contains("react")
                                || text.contains("typescript")
                                || text.contains("javascript")
                                || text.contains("docker")
                                || text.contains("linux")
                                || text.contains("mysql")
                                || text.contains("redis")
                                || text.contains("kafka")
                                || text.contains("elasticsearch")
                                || text.contains("openai")
                                || text.contains("deepseek")
                                || text.contains("ai")
                                || text.contains("llm")
                                || text.contains("prompt");
        }

        private String buildAssistantCapabilityAnswer() {
                return "你好，我是 MyBlog 的 AI 助手。\n\n" +
                                "我可以帮你：\n" +
                                "• 查找、推荐和解释站内文章\n" +
                                "• 了解 MyBlog 的技术栈、分类和标签\n" +
                                "• 回答技术、编程、软件工程、AI 使用和技术写作相关问题\n" +
                                "• 辅助生成标题、摘要、关键词和润色内容\n\n" +
                                "我不会回答天气、生活闲聊、娱乐八卦等和技术或本站无关的问题。";
        }

        private String handleWithRules(String question, String context) {
                String lowerQ = question.toLowerCase();

                if (lowerQ.contains("技术栈") || lowerQ.contains("用了什么技术") || lowerQ.contains("技术选型")) {
                        return "MyBlog采用现代化技术栈：\n\n" +
                                        "🔹 后端：Spring Boot 3.5 + MyBatis Plus + MySQL + Redis + Elasticsearch\n" +
                                        "🔹 前端：React 19 + TypeScript + Vite + TailwindCSS\n" +
                                        "🔹 部署：Docker + Nginx\n\n" +
                                        "完整的前后端分离架构，支持全文搜索和分布式缓存！";
                }

                if (lowerQ.contains("有什么文章") || lowerQ.contains("文章列表") || lowerQ.contains("推荐文章")) {
                        List<BlogListVO> recentBlogs = blogService.getRecentBlogs(5);
                        String articles = recentBlogs.stream()
                                        .map(b -> "• " + b.getTitle())
                                        .collect(Collectors.joining("\n"));
                        return "这里有一些最新文章：\n\n" + articles + "\n\n你可以在首页浏览更多内容！";
                }

                if (lowerQ.contains("热门") || lowerQ.contains("最火") || lowerQ.contains("阅读量")) {
                        List<BlogDetailVO> hotBlogsDetail = blogService.getHotBlogs(5);
                        String articles = hotBlogsDetail.stream()
                                        .map(b -> "• " + b.getTitle() + " ("
                                                        + (b.getViewCount() != null ? b.getViewCount() : 0) + "次阅读)")
                                        .collect(Collectors.joining("\n"));
                        return "最热门的文章有：\n\n" + articles;
                }

                if (lowerQ.contains("分类") || lowerQ.contains("类别")) {
                        List<Category> categories = categoryService.getAllCategoriesWithCount();
                        String cats = categories.stream()
                                        .map(c -> "• " + c.getName() + "：" + c.getDescription())
                                        .collect(Collectors.joining("\n"));
                        return "博客包含以下分类：\n\n" + cats;
                }

                if (lowerQ.contains("标签") || lowerQ.contains("tag")) {
                        List<Tag> tags = tagService.getAllTags();
                        String tagList = tags.stream()
                                        .limit(15)
                                        .map(Tag::getName)
                                        .collect(Collectors.joining("、"));
                        return "常用技术标签有：\n\n" + tagList + "\n\n等" + tags.size() + "个标签";
                }

                return "我可以帮你了解这个博客的内容和技术栈！\n\n" +
                                "你可以问我：\n" +
                                "• 这个博客有什么文章？\n" +
                                "• 使用了什么技术栈？\n" +
                                "• 有哪些分类和标签？\n" +
                                "• 推荐一些热门文章\n\n" +
                                "快来试试吧！";
        }

        private AIChatResponse buildChatResponse(AIChatRequest request, String answer, boolean aiEnabled, long startTime, List<AIChatResponse.RelatedArticle> relatedArticles) {
                return AIChatResponse.builder()
                                .answer(answer)
                                .conversationId(request.getConversationId() != null ? request.getConversationId() : generateConversationId())
                                .aiEnabled(aiEnabled)
                                .responseTime(elapsed(startTime))
                                .relatedArticles(relatedArticles)
                                .build();
        }

        private String generateConversationId() {
                return UUID.randomUUID().toString();
        }

        private List<AIChatResponse.RelatedArticle> extractRelatedArticles(String answer) {
                List<AIChatResponse.RelatedArticle> articles = new java.util.ArrayList<>();
                List<BlogListVO> allBlogs = getRelatedArticleCandidates();
                for (BlogListVO blog : allBlogs) {
                        if (answer.contains(blog.getTitle())) {
                                articles.add(AIChatResponse.RelatedArticle.builder()
                                                .id(blog.getId())
                                                .title(blog.getTitle())
                                                .build());
                        }
                }
                return articles;
        }

        private List<AIChatResponse.RelatedArticle> relatedArticlesForAnswer(List<RagSearchResult> ragResults, String answer) {
                List<AIChatResponse.RelatedArticle> ragArticles = toRelatedArticles(ragResults);
                return ragArticles.isEmpty() ? extractRelatedArticles(answer) : ragArticles;
        }

        private List<AIChatResponse.RelatedArticle> toRelatedArticles(List<RagSearchResult> ragResults) {
                if (ragResults == null || ragResults.isEmpty()) {
                        return List.of();
                }
                Map<Long, AIChatResponse.RelatedArticle> articles = new java.util.LinkedHashMap<>();
                for (RagSearchResult result : ragResults) {
                        if (result.getBlogId() == null || articles.containsKey(result.getBlogId())) {
                                continue;
                        }
                        articles.put(result.getBlogId(), AIChatResponse.RelatedArticle.builder()
                                        .id(result.getBlogId())
                                        .publicId(result.getPublicId())
                                        .title(result.getTitle())
                                        .categoryId(result.getCategoryId())
                                        .categoryName(result.getCategoryName())
                                        .tags(result.getTags())
                                        .publishTime(result.getPublishTime())
                                        .snippet(result.getSnippet())
                                        .score(result.getScore())
                                        .build());
                }
                return new java.util.ArrayList<>(articles.values());
        }

        private List<BlogListVO> getRelatedArticleCandidates() {
                long now = System.currentTimeMillis();
                if (!cachedRelatedArticleCandidates.isEmpty() && now < relatedArticleCandidatesExpiresAt) {
                        return cachedRelatedArticleCandidates;
                }
                synchronized (this) {
                        now = System.currentTimeMillis();
                        if (!cachedRelatedArticleCandidates.isEmpty() && now < relatedArticleCandidatesExpiresAt) {
                                return cachedRelatedArticleCandidates;
                        }
                        List<BlogListVO> fresh = blogService.getRecentBlogs(RELATED_ARTICLES_SCAN_LIMIT);
                        cachedRelatedArticleCandidates = fresh != null ? fresh : java.util.Collections.emptyList();
                        relatedArticleCandidatesExpiresAt = now + RELATED_ARTICLES_CACHE_TTL_MS;
                        return cachedRelatedArticleCandidates;
                }
        }

        @Override
        public String generateTitle(String content, String style) {
                String requestId = newRequestId(AiAction.TITLE);
                long totalStart = System.currentTimeMillis();
                if (!isAIAvailable()) {
                        int length = Math.min(50, content.length());
                        return content.substring(0, length).replaceAll("\\s+", " ").trim() + "...";
                }

                String cacheKey = buildCacheKey("title", content, style);
                String cached = getCachedValue(cacheKey);
                if (cached != null) {
                        logAiSuccess(requestId, AiAction.TITLE, 0, true, 0, -1, -1, 0, elapsed(totalStart), cached.length());
                        return cached;
                }

                String prompt = String.format(
                                "为文章生成一个中文标题。要求：不超过30字；突出核心内容；只返回标题，不解释。\n%s\n文章内容：\n%s",
                                buildStyleHint(style), truncateContent(content, 1000));

                String result = ensureNonBlankAiResult(callAI(AiAction.TITLE, prompt, requestId, 0, totalStart), "标题");
                cacheValue(cacheKey, result);
                return result;
        }

        @Override
        public String polishContent(String content, String style) {
                String requestId = newRequestId(AiAction.POLISH);
                long totalStart = System.currentTimeMillis();
                if (!isAIAvailable()) {
                        return content;
                }

                String cacheKey = buildCacheKey("polish", content, style);
                String cached = getCachedValue(cacheKey);
                if (cached != null) {
                        logAiSuccess(requestId, AiAction.POLISH, 0, true, 0, -1, -1, 0, elapsed(totalStart), cached.length());
                        return cached;
                }

                String prompt = String.format(
                                "润色下面文章。要求：保持原意；修正错别字和语病；表达更流畅；只返回润色后的正文，不解释。\n%s\n原文：\n%s",
                                buildStyleHint(style), truncateContent(content, POLISH_MAX_CONTENT_CHARS));

                String result = ensureNonBlankAiResult(callAI(AiAction.POLISH, prompt, requestId, 0, totalStart), "润色内容");
                cacheValue(cacheKey, result);
                return result;
        }

        @Override
        public String generateSummary(String content, String style) {
                String requestId = newRequestId(AiAction.SUMMARY);
                long totalStart = System.currentTimeMillis();
                if (!isAIAvailable()) {
                        int length = Math.min(200, content.length());
                        return content.substring(0, length).replaceAll("\\s+", " ").trim() + "...";
                }

                String cacheKey = buildCacheKey("summary", content, style);
                String cached = getCachedValue(cacheKey);
                if (cached != null) {
                        logAiSuccess(requestId, AiAction.SUMMARY, 0, true, 0, -1, -1, 0, elapsed(totalStart), cached.length());
                        return cached;
                }

                String prompt = String.format(
                                "为文章生成中文摘要。要求：100-200字；准确概括核心内容；只返回摘要，不解释。\n%s\n文章内容：\n%s",
                                buildStyleHint(style), truncateContent(content, SUMMARY_MAX_CONTENT_CHARS));

                String result = ensureNonBlankAiResult(callAI(AiAction.SUMMARY, prompt, requestId, 0, totalStart), "摘要");
                cacheValue(cacheKey, result);
                return result;
        }

        @Override
        public List<String> extractKeywords(String content, String style) {
                String requestId = newRequestId(AiAction.KEYWORDS);
                long totalStart = System.currentTimeMillis();
                if (!isAIAvailable()) {
                        return extractKeywordsByRules(content, 8);
                }

                String cacheKey = buildCacheKey("keywords", content, style);
                String cached = getCachedValue(cacheKey);
                if (cached != null) {
                        List<String> cachedKeywords = parseKeywords(cached);
                        if (!cachedKeywords.isEmpty()) {
                                logAiSuccess(requestId, AiAction.KEYWORDS, 0, true, 0, -1, -1, 0, elapsed(totalStart), cached.length());
                                return cachedKeywords;
                        }
                        deleteCacheQuietly(cacheKey);
                }

                String prompt = String.format(
                                "从文章中提取5-8个中文或英文关键词。要求：用逗号分隔；只返回关键词列表，不解释。\n%s\n文章内容：\n%s",
                                buildStyleHint(style), truncateContent(content, 2000));

                String result = ensureNonBlankAiResult(callAI(AiAction.KEYWORDS, prompt, requestId, 0, totalStart), "关键词");
                List<String> parsedKeywords = parseKeywords(result);
                if (parsedKeywords.isEmpty()) {
                        List<String> fallbackKeywords = extractKeywordsByRules(content, 8);
                        if (!fallbackKeywords.isEmpty()) {
                                log.warn("AI关键词解析为空，已回退规则提取 requestId={} key={}", requestId, cacheKey);
                                return fallbackKeywords;
                        }
                        throw new RuntimeException("AI提取关键词结果为空，请重试");
                }
                cacheValue(cacheKey, result);
                return parsedKeywords;
        }

        private List<String> parseKeywords(String rawText) {
                return java.util.Arrays.stream(rawText.split("[,，、\\n\\r]"))
                                .map(String::trim)
                                .map(s -> s.replaceAll("^[0-9]+[\\.)、：:\\-\\s]+", ""))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .limit(8)
                                .collect(Collectors.toList());
        }

        private String buildCacheKey(String action, String content, String style) {
                String base = action + ":" + (content != null ? content.hashCode() : 0) + ":" + (style != null ? style : "default");
                return "ai:cache:" + openAiRuntimeConfigService.getRuntimeFingerprint().hashCode() + ":" + base;
        }

        private String buildChatCacheKey(String question, List<AIChatRequest.ChatMessage> history, String context) {
                StringBuilder fingerprint = new StringBuilder();
                fingerprint.append("runtime=").append(openAiRuntimeConfigService.getRuntimeFingerprint()).append('|');
                fingerprint.append("prompt=").append(CHAT_PROMPT_VERSION).append('|');
                fingerprint.append("blogScoped=").append(isBlogScopedQuestion(question)).append('|');
                fingerprint.append(question != null ? question.trim() : "");
                fingerprint.append("|ctx=").append(context != null ? context.hashCode() : 0);

                if (history != null && !history.isEmpty()) {
                        int startIndex = Math.max(0, history.size() - CHAT_HISTORY_LIMIT);
                        for (AIChatRequest.ChatMessage msg : history.subList(startIndex, history.size())) {
                                fingerprint.append('|')
                                                .append(msg.getRole() != null ? msg.getRole() : "")
                                                .append(':')
                                                .append(truncateContent(msg.getContent(), CHAT_HISTORY_MESSAGE_MAX_CHARS));
                        }
                }

                return "ai:cache:chat:" + fingerprint.toString().hashCode();
        }

        private String getCachedValue(String key) {
                return getCachedValue(key, DEFAULT_CACHE_TTL_SECONDS);
        }

        private String getCachedValue(String key, int ttlSeconds) {
                try {
                        String cached = cacheService.get(key, String.class);
                        if (cached == null) {
                                return null;
                        }
                        String sanitized = sanitizeAiOutput(cached);
                        if (sanitized.isBlank()) {
                                deleteCacheQuietly(key);
                                return null;
                        }
                        if (!cached.equals(sanitized)) {
                                cacheValue(key, sanitized, ttlSeconds);
                        }
                        return sanitized;
                } catch (Exception e) {
                        return null;
                }
        }

        private void cacheValue(String key, String value) {
                cacheValue(key, value, DEFAULT_CACHE_TTL_SECONDS);
        }

        private void cacheValue(String key, String value, int ttlSeconds) {
                try {
                        cacheService.set(key, value, ttlSeconds);
                } catch (Exception ignored) {
                }
        }

        private void deleteCacheQuietly(String key) {
                try {
                        cacheService.delete(key);
                } catch (Exception ignored) {
                }
        }

        private String buildStyleHint(String style) {
                if (style == null || style.isBlank()) {
                        return "";
                }
                return "风格要求：" + style + "\n";
        }

        private boolean isAIAvailable() {
                return openAiRuntimeConfigService.isAiAvailable();
        }

        private String callAI(AiAction action, String prompt, String requestId, long contextMs, long totalStart) {
                long modelStart = System.currentTimeMillis();
                int maxTokens = openAiRuntimeConfigService.getMaxTokens(action);
                log.info("AI调用开始 requestId={} action={} promptChars={} maxTokens={}",
                                requestId, action, prompt.length(), maxTokens);
                try {
                        ChatClient chatClient = getChatClient();
                        if (chatClient == null) {
                                throw new RuntimeException("AI模型尚未初始化");
                        }
                        String rawResult = chatClient.prompt()
                                        .options(openAiRuntimeConfigService.getChatOptions(action))
                                        .user(prompt)
                                        .call()
                                        .content();
                        long modelTotalMs = elapsed(modelStart);
                        long postStart = System.currentTimeMillis();
                        String result = sanitizeAiOutput(rawResult);
                        long postProcessMs = elapsed(postStart);
                        if (!rawResult.equals(result)) {
                                log.warn("检测到模型思考内容并已过滤 requestId={} action={} rawChars={} sanitizedChars={}",
                                                requestId, action, rawResult.length(), result.length());
                        }
                        logAiSuccess(requestId, action, prompt.length(), false, contextMs, -1, modelTotalMs,
                                        postProcessMs, elapsed(totalStart), result.length());
                        return result;
                } catch (Exception e) {
                        log.error("AI调用失败 requestId={} action={} promptChars={} maxTokens={} modelTotalMs={} totalMs={}",
                                        requestId, action, prompt.length(), maxTokens, elapsed(modelStart), elapsed(totalStart), e);
                        throw new RuntimeException("AI服务暂时不可用，请稍后再试");
                }
        }

        private StreamResult streamAI(AiAction action, String prompt, String requestId, long contextMs, long totalStart, SseEmitter emitter) {
                long modelStart = System.currentTimeMillis();
                int maxTokens = openAiRuntimeConfigService.getMaxTokens(action);
                AtomicBoolean firstChunk = new AtomicBoolean(true);
                AtomicLong firstTokenMs = new AtomicLong(-1L);
                StringBuilder rawAnswer = new StringBuilder();
                StreamingThinkSanitizer streamingSanitizer = new StreamingThinkSanitizer();

                log.info("AI流式调用开始 requestId={} action={} promptChars={} maxTokens={}",
                                requestId, action, prompt.length(), maxTokens);
                ChatClient chatClient = getChatClient();
                if (chatClient == null) {
                        throw new RuntimeException("AI模型尚未初始化");
                }
                chatClient.prompt()
                                .options(openAiRuntimeConfigService.getChatOptions(action))
                                .user(prompt)
                                .stream()
                                .content()
                                .doOnNext(chunk -> {
                                        if (firstChunk.compareAndSet(true, false)) {
                                                firstTokenMs.set(elapsed(modelStart));
                                        }
                                        rawAnswer.append(chunk);
                                        String sanitizedChunk = streamingSanitizer.accept(chunk);
                                        if (!sanitizedChunk.isEmpty()) {
                                                sendSse(emitter, "delta", Map.of("text", sanitizedChunk));
                                        }
                                })
                                .blockLast();

                String tail = streamingSanitizer.finish();
                if (!tail.isEmpty()) {
                        sendSse(emitter, "delta", Map.of("text", tail));
                }

                long modelTotalMs = elapsed(modelStart);
                long postStart = System.currentTimeMillis();
                String answer = sanitizeAiOutput(rawAnswer.toString());
                long postProcessMs = elapsed(postStart);
                logAiSuccess(requestId, action, prompt.length(), false, contextMs, firstTokenMs.get(), modelTotalMs,
                                postProcessMs, elapsed(totalStart), answer.length());
                return new StreamResult(answer, firstTokenMs.get(), modelTotalMs, postProcessMs);
        }

        private ChatClient getChatClient() {
                return openAiRuntimeConfigService.getChatClient();
        }

        private void sendSse(SseEmitter emitter, String eventName, Object data) {
                try {
                        emitter.send(SseEmitter.event().name(eventName).data(data));
                } catch (IOException e) {
                        throw new IllegalStateException("SSE发送失败", e);
                }
        }

        private void sendAnswerChunks(SseEmitter emitter, String answer) {
                int chunkSize = 80;
                for (int i = 0; i < answer.length(); i += chunkSize) {
                        sendSse(emitter, "delta", Map.of("text", answer.substring(i, Math.min(i + chunkSize, answer.length()))));
                }
        }

        private void sendRelatedArticles(SseEmitter emitter, String answer) {
                List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                if (!relatedArticles.isEmpty()) {
                        sendSse(emitter, "relatedArticles", Map.of("items", relatedArticles));
                }
        }

        private void sendRelatedArticles(SseEmitter emitter, List<RagSearchResult> ragResults, String answer) {
                List<AIChatResponse.RelatedArticle> relatedArticles = relatedArticlesForAnswer(ragResults, answer);
                if (!relatedArticles.isEmpty()) {
                        sendSse(emitter, "relatedArticles", Map.of("items", relatedArticles));
                }
        }

        private void sendDone(SseEmitter emitter, AIChatRequest request, long totalStart, boolean cached, boolean aiEnabled) {
                sendSse(emitter, "done", Map.of(
                                "conversationId", request.getConversationId() != null ? request.getConversationId() : generateConversationId(),
                                "responseTime", elapsed(totalStart),
                                "cached", cached,
                                "aiEnabled", aiEnabled));
                emitter.complete();
        }

        private AIChatRequest requestWithConversationId(AIChatRequest request, String conversationId) {
                if (request.getConversationId() != null || conversationId == null) {
                        return request;
                }
                AIChatRequest copy = new AIChatRequest();
                copy.setQuestion(request.getQuestion());
                copy.setConversationId(conversationId);
                copy.setHistory(request.getHistory());
                return copy;
        }

        private String sanitizeAiOutput(String rawOutput) {
                if (rawOutput == null || rawOutput.isBlank()) {
                        return "";
                }
                String sanitized = THINK_BLOCK_PATTERN.matcher(rawOutput).replaceAll("");
                sanitized = THINK_TAG_PATTERN.matcher(sanitized).replaceAll("");
                return sanitized.trim();
        }

        private String ensureNonBlankAiResult(String text, String action) {
                if (text == null || text.isBlank()) {
                        throw new RuntimeException("AI生成" + action + "为空，请重试");
                }
                return text;
        }

        private List<String> extractKeywordsByRules(String content, int limit) {
                if (content == null || content.isBlank()) {
                        return java.util.Collections.emptyList();
                }

                String normalized = content
                                .replaceAll("```[\\s\\S]*?```", " ")
                                .replaceAll("`[^`]*`", " ")
                                .replaceAll("[^\\p{IsHan}A-Za-z0-9#\\+\\-]", " ");

                java.util.LinkedHashSet<String> results = new java.util.LinkedHashSet<>();

                java.util.regex.Matcher enMatcher = Pattern.compile("\\b[a-zA-Z][a-zA-Z0-9_+\\-#]{2,24}\\b")
                                .matcher(normalized);
                while (enMatcher.find() && results.size() < limit) {
                        String token = enMatcher.group().toLowerCase();
                        if (!isEnglishKeywordNoise(token)) {
                                results.add(token);
                        }
                }

                java.util.regex.Matcher zhMatcher = Pattern.compile("[\\p{IsHan}]{2,8}").matcher(normalized);
                while (zhMatcher.find() && results.size() < limit) {
                        String token = zhMatcher.group().trim();
                        if (!isChineseKeywordNoise(token)) {
                                results.add(token);
                        }
                }

                return results.stream().limit(limit).collect(Collectors.toList());
        }

        private boolean isEnglishKeywordNoise(String token) {
                return token.length() < 3 ||
                                java.util.Set.of("the", "and", "for", "with", "this", "that", "from", "into", "http",
                                                "https", "www", "com", "org", "net", "null", "true", "false")
                                                .contains(token);
        }

        private boolean isChineseKeywordNoise(String token) {
                return java.util.Set.of("我们", "你们", "他们", "以及", "如果", "因为", "所以", "然后", "就是", "这个", "那个",
                                "需要", "进行", "通过", "一个", "一些", "可以", "没有", "自己", "这里", "如何")
                                .contains(token);
        }

        private String truncateContent(String content, int maxLength) {
                if (content == null || content.isEmpty()) {
                        return "";
                }
                return content.length() > maxLength ? content.substring(0, maxLength) + "..." : content;
        }

        private String formatRagMetadata(RagSearchResult result) {
                List<String> parts = new java.util.ArrayList<>();
                if (result.getCategoryName() != null && !result.getCategoryName().isBlank()) {
                        parts.add("分类：" + result.getCategoryName());
                }
                String tags = formatTagNames(result);
                if (!tags.isBlank()) {
                        parts.add("标签：" + tags);
                }
                String publishDate = formatPublishDate(result.getPublishTime());
                if (!publishDate.isBlank()) {
                        parts.add("发布日期：" + publishDate);
                }
                return parts.isEmpty() ? "" : "（" + String.join("，", parts) + "）";
        }

        private String formatTagNames(RagSearchResult result) {
                if (result.getTags() == null || result.getTags().isEmpty()) {
                        return "";
                }
                return result.getTags().stream()
                                .map(tag -> tag.getName() != null ? tag.getName().trim() : "")
                                .filter(name -> !name.isEmpty())
                                .collect(Collectors.joining("、"));
        }

        private String formatPublishDate(String publishTime) {
                if (publishTime == null || publishTime.isBlank()) {
                        return "";
                }
                return publishTime.length() >= 10 ? publishTime.substring(0, 10) : publishTime;
        }

        private String newRequestId(AiAction action) {
                return action.name().toLowerCase() + "-" + UUID.randomUUID().toString().substring(0, 8);
        }

        private long elapsed(long startMs) {
                return System.currentTimeMillis() - startMs;
        }

        private void logAiSuccess(String requestId, AiAction action, int promptChars, boolean cacheHit, long contextMs,
                                  long modelFirstTokenMs, long modelTotalMs, long postProcessMs, long totalMs, int resultChars) {
                log.info("AI调用完成 requestId={} action={} promptChars={} cacheHit={} contextMs={} modelFirstTokenMs={} modelTotalMs={} postProcessMs={} totalMs={} resultChars={} maxTokens={}",
                                requestId, action, promptChars, cacheHit, contextMs, modelFirstTokenMs, modelTotalMs,
                                postProcessMs, totalMs, resultChars, openAiRuntimeConfigService.getMaxTokens(action));
        }

        private record StreamResult(String answer, long firstTokenMs, long modelTotalMs, long postProcessMs) {
        }

        private static final class StreamingThinkSanitizer {
                private static final int LOOKBEHIND_CHARS = 32;
                private final StringBuilder buffer = new StringBuilder();
                private boolean insideThinkBlock = false;

                String accept(String chunk) {
                        if (chunk == null || chunk.isEmpty()) {
                                return "";
                        }
                        buffer.append(chunk);
                        StringBuilder output = new StringBuilder();
                        while (true) {
                                String current = buffer.toString();
                                String lower = current.toLowerCase();
                                if (insideThinkBlock) {
                                        int closeIndex = findCloseThinkTag(lower);
                                        if (closeIndex < 0) {
                                                keepTailOnly();
                                                return output.toString();
                                        }
                                        int closeEnd = current.indexOf('>', closeIndex);
                                        if (closeEnd < 0) {
                                                keepTailOnly();
                                                return output.toString();
                                        }
                                        buffer.delete(0, closeEnd + 1);
                                        insideThinkBlock = false;
                                        continue;
                                }

                                int openIndex = findOpenThinkTag(lower);
                                if (openIndex < 0) {
                                        int emitLength = Math.max(0, buffer.length() - LOOKBEHIND_CHARS);
                                        if (emitLength > 0) {
                                                output.append(buffer.substring(0, emitLength));
                                                buffer.delete(0, emitLength);
                                        }
                                        return stripThinkTags(output.toString());
                                }

                                if (openIndex > 0) {
                                        output.append(buffer.substring(0, openIndex));
                                }
                                buffer.delete(0, openIndex);
                                insideThinkBlock = true;
                        }
                }

                String finish() {
                        if (insideThinkBlock) {
                                buffer.setLength(0);
                                return "";
                        }
                        String tail = stripThinkTags(buffer.toString());
                        buffer.setLength(0);
                        return tail;
                }

                private void keepTailOnly() {
                        if (buffer.length() > LOOKBEHIND_CHARS) {
                                buffer.delete(0, buffer.length() - LOOKBEHIND_CHARS);
                        }
                }

                private static int findOpenThinkTag(String lower) {
                        int think = lower.indexOf("<think");
                        int thinking = lower.indexOf("<thinking");
                        if (think < 0) {
                                return thinking;
                        }
                        if (thinking < 0) {
                                return think;
                        }
                        return Math.min(think, thinking);
                }

                private static int findCloseThinkTag(String lower) {
                        int think = lower.indexOf("</think");
                        int thinking = lower.indexOf("</thinking");
                        if (think < 0) {
                                return thinking;
                        }
                        if (thinking < 0) {
                                return think;
                        }
                        return Math.min(think, thinking);
                }

                private static String stripThinkTags(String text) {
                        return THINK_TAG_PATTERN.matcher(text).replaceAll("");
                }
        }
}
