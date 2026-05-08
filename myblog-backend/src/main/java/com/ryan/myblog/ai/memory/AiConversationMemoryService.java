package com.ryan.myblog.ai.memory;

import com.ryan.myblog.common.PageResult;
import com.ryan.myblog.model.entity.AiMessage;
import com.ryan.myblog.model.vo.AiConversationVO;

import java.util.List;

public interface AiConversationMemoryService {

    ConversationContext loadOrCreate(String conversationId, Long userId, String firstQuestion);

    AiMessage appendMessage(String conversationId, String role, String content);

    void refreshConversation(String conversationId, String latestAnswer);

    PageResult<AiConversationVO> listUserConversations(Long userId, int page, int size);

    AiConversationVO getUserConversation(Long userId, String conversationId);

    void deleteUserConversation(Long userId, String conversationId);

    PageResult<AiConversationVO> listAdminConversations(int page, int size);

    record ConversationContext(String conversationId,
                               Long userId,
                               String summary,
                               List<AiMessage> recentMessages) {
    }
}
