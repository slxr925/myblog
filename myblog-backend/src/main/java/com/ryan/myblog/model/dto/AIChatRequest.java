package com.ryan.myblog.model.dto;

import lombok.Data;
import java.util.List;

/**
 * AI聊天请求DTO
 */
@Data
public class AIChatRequest {
    /**
     * 用户问题
     */
    private String question;

    /**
     * 对话ID（用于保持上下文）
     */
    private String conversationId;

    /**
     * 对话历史记录
     */
    private List<ChatMessage> history;

    /**
     * 单条聊天消息
     */
    @Data
    public static class ChatMessage {
        /**
         * 消息角色：user 或 assistant
         */
        private String role;

        /**
         * 消息内容
         */
        private String content;
    }
}
