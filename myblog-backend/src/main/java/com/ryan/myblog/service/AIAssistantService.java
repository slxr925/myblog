package com.ryan.myblog.service;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * AI智能助手服务
 * 提供博客相关问答功能和内容生成
 */
public interface AIAssistantService {

    /**
     * 处理用户问题
     * 
     * @param request 用户问题
     * @return AI回答
     */
    AIChatResponse chat(AIChatRequest request);

    /**
     * 以SSE流式处理用户问题。
     *
     * @param request 用户问题
     * @return SSE emitter
     */
    SseEmitter streamChat(AIChatRequest request, AiStreamLifecycle lifecycle);

    /**
     * 获取助手介绍信息
     * 
     * @return 介绍文本
     */
    String getIntroduction();

    /**
     * 生成文章标题
     * 
     * @param content 文章内容
     * @return 生成的标题
     */
    String generateTitle(String content, String style);

    /**
     * 润色文章内容
     * 
     * @param content 原始内容
     * @return 润色后的内容
     */
    String polishContent(String content, String style);

    /**
     * 生成文章摘要
     * 
     * @param content 文章内容
     * @return 生成的摘要
     */
    String generateSummary(String content, String style);

    /**
     * 提取文章关键词
     * 
     * @param content 文章内容
     * @return 关键词列表
     */
    List<String> extractKeywords(String content, String style);
}
