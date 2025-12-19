package com.ryan.myblog.service;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.model.dto.AIChatResponse;

/**
 * AI智能助手服务
 * 提供博客相关问答功能
 */
public interface AIAssistantService {
    
    /**
     * 处理用户问题
     * @param request 用户问题
     * @return AI回答
     */
    AIChatResponse chat(AIChatRequest request);
    
    /**
     * 获取助手介绍信息
     * @return 介绍文本
     */
    String getIntroduction();
}
