package com.ryan.myblog.ai.prompt;

public interface PromptTemplateService {

    PromptTemplate getTemplate(String key);

    record PromptTemplate(String key, String version, String content, boolean enabled) {
    }
}
