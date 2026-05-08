package com.ryan.myblog.ai.prompt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourcePromptTemplateService implements PromptTemplateService {

    private static final String VERSION = "resource-v1";
    private static final Map<String, String> RESOURCE_PATHS = Map.of(
            "agent.system", "classpath:prompts/agent-system.md",
            "chat.general", "classpath:prompts/chat-general.md",
            "content.summary", "classpath:prompts/content-summary.md",
            "content.tags", "classpath:prompts/content-tags.md",
            "content.polish", "classpath:prompts/content-polish.md");

    private static final Map<String, String> DEFAULTS = Map.of(
            "agent.system", """
                    你是 MyBlog 站内 AI Agent。你只能在需要站内数据时调用已注册工具，不能编造文章、标签、阅读量、日期或作者。
                    回答技术、编程、软件工程、AI 使用和技术写作相关问题。非相关问题请简短说明超出范围。
                    工具结果不足时要说明依据有限，并给出谨慎建议。不要输出思考过程。
                    """,
            "chat.general", """
                    请基于会话记忆和必要的工具结果回答用户问题。回答要直接、准确、可执行。
                    """,
            "content.summary", "为文章生成 100-200 字中文摘要，只返回摘要。",
            "content.tags", "为文章推荐 5-8 个标签，优先复用已有标签。",
            "content.polish", "润色文章内容，保持原意，只返回润色后的正文。");

    private final ResourceLoader resourceLoader;
    private final Map<String, PromptTemplate> cache = new ConcurrentHashMap<>();

    @Override
    public PromptTemplate getTemplate(String key) {
        return cache.computeIfAbsent(key, this::loadTemplate);
    }

    private PromptTemplate loadTemplate(String key) {
        String path = RESOURCE_PATHS.get(key);
        if (path != null) {
            try {
                Resource resource = resourceLoader.getResource(path);
                if (resource.exists()) {
                    String content = resource.getContentAsString(StandardCharsets.UTF_8);
                    return new PromptTemplate(key, VERSION, content.trim(), true);
                }
            } catch (Exception e) {
                log.warn("加载Prompt模板失败 key={} path={} error={}", key, path, e.getMessage());
            }
        }
        return new PromptTemplate(key, "default-v1", DEFAULTS.getOrDefault(key, ""), true);
    }
}
