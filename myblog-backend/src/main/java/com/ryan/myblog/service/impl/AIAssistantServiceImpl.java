package com.ryan.myblog.service.impl;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import com.ryan.myblog.service.AIAssistantService;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.service.CategoryService;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.model.vo.BlogListVO;
import com.ryan.myblog.model.vo.BlogDetailVO;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * AI智能助手服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AIAssistantServiceImpl implements AIAssistantService {

        private final BlogService blogService;
        private final CategoryService categoryService;
        private final TagService tagService;

        @Autowired(required = false)
        private OpenAiChatModel chatModel;

        @Value("${spring.ai.enabled:false}")
        private boolean aiEnabled;

        @Value("${spring.ai.openai.api-key:}")
        private String apiKey;

        @jakarta.annotation.PostConstruct
        public void logAIConfig() {
                log.info("AIAssistantService配置: aiEnabled={}, apiKey长度={}, chatModel注入={}",
                                aiEnabled,
                                apiKey != null ? apiKey.length() : 0,
                                chatModel != null);
        }

        @Override
        public AIChatResponse chat(AIChatRequest request) {
                long startTime = System.currentTimeMillis();

                try {
                        // 构建上下文信息
                        String context = buildContext();

                        // 判断是否启用AI
                        if (!aiEnabled || apiKey == null || apiKey.isEmpty()) {
                                // 降级策略：使用规则匹配
                                String answer = handleWithRules(request.getQuestion(), context);
                                List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                                return AIChatResponse.builder()
                                                .answer(answer)
                                                .conversationId(generateConversationId())
                                                .aiEnabled(false)
                                                .responseTime(System.currentTimeMillis() - startTime)
                                                .relatedArticles(relatedArticles)
                                                .build();
                        }

                        // 使用AI处理
                        String answer = handleWithAI(request.getQuestion(), context, request.getHistory());
                        List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                        return AIChatResponse.builder()
                                        .answer(answer)
                                        .conversationId(request.getConversationId() != null
                                                        ? request.getConversationId()
                                                        : generateConversationId())
                                        .aiEnabled(true)
                                        .responseTime(System.currentTimeMillis() - startTime)
                                        .relatedArticles(relatedArticles)
                                        .build();

                } catch (Exception e) {
                        log.error("AI助手处理失败", e);
                        // 降级处理
                        String context = buildContext();
                        String answer = handleWithRules(request.getQuestion(), context);
                        List<AIChatResponse.RelatedArticle> relatedArticles = extractRelatedArticles(answer);
                        return AIChatResponse.builder()
                                        .answer(answer)
                                        .conversationId(generateConversationId())
                                        .aiEnabled(false)
                                        .responseTime(System.currentTimeMillis() - startTime)
                                        .relatedArticles(relatedArticles)
                                        .build();
                }
        }

        @Override
        public String getIntroduction() {
                return "你好！我是MyBlog智能助手🤖\n\n" +
                                "我可以帮你：\n" +
                                "• 查找感兴趣的文章\n" +
                                "• 了解博客的技术栈\n" +
                                "• 推荐相关主题的内容\n" +
                                "• 回答关于项目的问题\n\n" +
                                "快来问我吧！";
        }

        /**
         * 构建博客上下文信息
         */
        private String buildContext() {
                StringBuilder context = new StringBuilder();

                // 获取所有分类 - 使用WithCount方法避免缓存问题
                List<Category> categories = categoryService.getAllCategoriesWithCount();
                context.append("博客分类：\n");
                categories.forEach(cat -> context.append("- ").append(cat.getName())
                                .append(": ").append(cat.getDescription()).append("\n"));

                // 获取所有标签
                List<Tag> tags = tagService.getAllTags();
                context.append("\n技术标签：\n");
                context.append(tags.stream()
                                .map(Tag::getName)
                                .collect(Collectors.joining("、")));

                // 获取最新文章
                List<BlogListVO> recentBlogs = blogService.getRecentBlogs(5);
                context.append("\n\n最新文章：\n");
                recentBlogs.forEach(blog -> context.append("- 《").append(blog.getTitle()).append("》\n"));

                // 获取热门文章
                List<BlogDetailVO> hotBlogsDetail = blogService.getHotBlogs(5);
                List<BlogListVO> hotBlogs = hotBlogsDetail.stream()
                                .map(blog -> {
                                        BlogListVO vo = new BlogListVO();
                                        vo.setId(blog.getId());
                                        vo.setTitle(blog.getTitle());
                                        vo.setViewCount(blog.getViewCount() != null ? blog.getViewCount().longValue()
                                                        : 0L);
                                        return vo;
                                })
                                .collect(Collectors.toList());
                context.append("\n\u70ed\u95e8\u6587\u7ae0\uff1a\n");
                hotBlogs.forEach(blog -> context.append("- \u300a").append(blog.getTitle())
                                .append("\u300b (").append(blog.getViewCount()).append("\u6b21\u9605\u8bfb)\n"));

                // 技术栈信息
                context.append("\n技术栈：\n");
                context.append("后端：Spring Boot 3.5 + MyBatis Plus + MySQL + Redis + Elasticsearch\n");
                context.append("前端：React 19 + TypeScript + Vite + TailwindCSS\n");
                context.append("部署：Docker + Nginx\n");

                return context.toString();
        }

        /**
         * 使用AI处理问题
         */
        private String handleWithAI(String question, String context, List<AIChatRequest.ChatMessage> history) {
                if (chatModel == null) {
                        log.warn("OpenAiChatModel未初始化，降级为规则匹配");
                        return handleWithRules(question, context);
                }

                ChatClient chatClient = ChatClient.builder(chatModel).build();

                // 构建历史对话上下文
                StringBuilder historyContext = new StringBuilder();
                if (history != null && !history.isEmpty()) {
                        historyContext.append("【对话历史】\n");
                        for (AIChatRequest.ChatMessage msg : history) {
                                String roleLabel = "user".equals(msg.getRole()) ? "用户" : "助手";
                                historyContext.append(roleLabel).append(": ").append(msg.getContent()).append("\n");
                        }
                        historyContext.append("\n");
                }

                String prompt = String.format(
                                "你是MyBlog博客的智能助手，由博主Ryan创建。你既是博客导航员，也是一个友好的技术聊天伙伴。\n\n" +
                                                "【核心原则】\n" +
                                                "1. 推荐文章时，只能推荐【博客信息】中明确列出的文章，不能编造不存在的文章\n" +
                                                "2. 引用数据（阅读量、日期等）必须使用上下文中提供的准确数字，没有就不提\n" +
                                                "3. 同一篇文章只推荐一次\n\n" +
                                                "【你的能力】\n" +
                                                "1. 帮助用户了解和探索博客中的文章\n" +
                                                "2. 回答技术相关的问题，可以结合你的知识进行解答\n" +
                                                "3. 如果博客中有相关文章，可以顺便推荐\n" +
                                                "4. 进行友好的日常对话，但记住你的主要身份是博客助手\n\n" +
                                                "【回答风格】\n" +
                                                "- 友好、简洁、有帮助\n" +
                                                "- 技术问题可以详细解答，同时推荐相关博客文章\n" +
                                                "- 非技术问题也可以聊，但可以适时引导到博客内容\n\n" +
                                                "【博客信息】\n%s\n\n" +
                                                "%s" +
                                                "【用户问题】%s",
                                context, historyContext.toString(), question);

                return chatClient.prompt()
                                .user(prompt)
                                .call()
                                .content();
        }

        /**
         * 使用规则匹配处理（降级策略）
         */
        private String handleWithRules(String question, String context) {
                String lowerQ = question.toLowerCase();

                // 技术栈相关
                if (lowerQ.contains("技术栈") || lowerQ.contains("用了什么技术") ||
                                lowerQ.contains("技术选型")) {
                        return "MyBlog采用现代化技术栈：\n\n" +
                                        "🔹 后端：Spring Boot 3.5 + MyBatis Plus + MySQL + Redis + Elasticsearch\n" +
                                        "🔹 前端：React 19 + TypeScript + Vite + TailwindCSS\n" +
                                        "🔹 部署：Docker + Nginx\n\n" +
                                        "完整的前后端分离架构，支持全文搜索和分布式缓存！";
                }

                // 文章相关
                if (lowerQ.contains("有什么文章") || lowerQ.contains("文章列表") ||
                                lowerQ.contains("推荐文章")) {
                        List<BlogListVO> recentBlogs = blogService.getRecentBlogs(5);
                        String articles = recentBlogs.stream()
                                        .map(b -> "• " + b.getTitle())
                                        .collect(Collectors.joining("\n"));
                        return "这里有一些最新文章：\n\n" + articles + "\n\n你可以在首页浏览更多内容！";
                }

                // 热门文章
                if (lowerQ.contains("热门") || lowerQ.contains("最火") || lowerQ.contains("阅读量")) {
                        List<BlogDetailVO> hotBlogsDetail = blogService.getHotBlogs(5);
                        String articles = hotBlogsDetail.stream()
                                        .map(b -> "• " + b.getTitle() + " ("
                                                        + (b.getViewCount() != null ? b.getViewCount() : 0) + "次阅读)")
                                        .collect(Collectors.joining("\n"));
                        return "最热门的文章有：\n\n" + articles;
                }

                // 分类相关
                if (lowerQ.contains("分类") || lowerQ.contains("类别")) {
                        List<Category> categories = categoryService.getAllCategoriesWithCount();
                        String cats = categories.stream()
                                        .map(c -> "• " + c.getName() + "：" + c.getDescription())
                                        .collect(Collectors.joining("\n"));
                        return "博客包含以下分类：\n\n" + cats;
                }

                // 标签相关
                if (lowerQ.contains("标签") || lowerQ.contains("tag")) {
                        List<Tag> tags = tagService.getAllTags();
                        String tagList = tags.stream()
                                        .limit(15)
                                        .map(Tag::getName)
                                        .collect(Collectors.joining("、"));
                        return "常用技术标签有：\n\n" + tagList + "\n\n等" + tags.size() + "个标签";
                }

                // 默认回复
                return "我可以帮你了解这个博客的内容和技术栈！\n\n" +
                                "你可以问我：\n" +
                                "• 这个博客有什么文章？\n" +
                                "• 使用了什么技术栈？\n" +
                                "• 有哪些分类和标签？\n" +
                                "• 推荐一些热门文章\n\n" +
                                "快来试试吧！";
        }

        private String generateConversationId() {
                return UUID.randomUUID().toString();
        }

        /**
         * 从回答中提取相关文章
         */
        private List<AIChatResponse.RelatedArticle> extractRelatedArticles(String answer) {
                List<AIChatResponse.RelatedArticle> articles = new java.util.ArrayList<>();

                // 获取所有已发布的文章
                List<BlogListVO> allBlogs = blogService.getRecentBlogs(50);

                // 检查回答中是否包含文章标题
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

        @Override
        public String generateTitle(String content) {
                if (!isAIAvailable()) {
                        // 降级：提取前50字作为标题
                        int length = Math.min(50, content.length());
                        return content.substring(0, length).replaceAll("\\s+", " ").trim() + "...";
                }

                String prompt = String.format(
                                "请为以下文章生成一个吸引人的标题，要求：\n" +
                                                "1. 简洁明了，不超过30字\n" +
                                                "2. 突出文章核心内容\n" +
                                                "3. 只返回标题文本，不要其他说明\n\n" +
                                                "文章内容：\n%s",
                                truncateContent(content, 1000));

                return callAI(prompt);
        }

        @Override
        public String polishContent(String content) {
                if (!isAIAvailable()) {
                        return content; // 降级：返回原文
                }

                String prompt = String.format(
                                "请润色以下文章内容，要求：\n" +
                                                "1. 保持原意不变\n" +
                                                "2. 优化语句表达，使其更流畅\n" +
                                                "3. 修正语法和错别字\n" +
                                                "4. 只返回润色后的内容，不要其他说明\n\n" +
                                                "原文：\n%s",
                                content);

                return callAI(prompt);
        }

        @Override
        public String generateSummary(String content) {
                if (!isAIAvailable()) {
                        // 降级：提取前200字
                        int length = Math.min(200, content.length());
                        return content.substring(0, length).replaceAll("\\s+", " ").trim() + "...";
                }

                String prompt = String.format(
                                "请为以下文章生成摘要，要求：\n" +
                                                "1. 简洁明了，100-200字\n" +
                                                "2. 准确概括文章核心内容\n" +
                                                "3. 只返回摘要文本，不要其他说明\n\n" +
                                                "文章内容：\n%s",
                                content);

                return callAI(prompt);
        }

        @Override
        public List<String> extractKeywords(String content) {
                if (!isAIAvailable()) {
                        // 降级：返回空列表
                        return java.util.Collections.emptyList();
                }

                String prompt = String.format(
                                "请从以下文章中提取5-8个关键词，要求：\n" +
                                                "1. 关键词需准确反映文章内容\n" +
                                                "2. 以逗号分隔\n" +
                                                "3. 只返回关键词列表，不要其他说明\n\n" +
                                                "文章内容：\n%s",
                                truncateContent(content, 2000));

                String result = callAI(prompt);
                return java.util.Arrays.stream(result.split("[,，、]"))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .limit(8)
                                .collect(Collectors.toList());
        }

        /**
         * 检查AI是否可用
         */
        private boolean isAIAvailable() {
                return aiEnabled && apiKey != null && !apiKey.isEmpty() && chatModel != null;
        }

        /**
         * 调用AI模型
         */
        private String callAI(String prompt) {
                log.info("准备调用AI，Prompt长度: {}", prompt.length());
                long start = System.currentTimeMillis();
                try {
                        ChatClient chatClient = ChatClient.builder(chatModel).build();
                        String result = chatClient.prompt()
                                        .user(prompt)
                                        .call()
                                        .content();
                        log.info("AI调用成功，耗时: {}ms, 结果长度: {}", System.currentTimeMillis() - start, result.length());
                        return result;
                } catch (Exception e) {
                        log.error("AI调用失败，耗时: {}ms", System.currentTimeMillis() - start, e);
                        throw new RuntimeException("AI服务暂时不可用，请稍后再试");
                }
        }

        /**
         * 截断内容
         */
        private String truncateContent(String content, int maxLength) {
                if (content == null || content.isEmpty()) {
                        return "";
                }
                return content.length() > maxLength
                                ? content.substring(0, maxLength) + "..."
                                : content;
        }
}
