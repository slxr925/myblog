package com.ryan.myblog.ai.memory;

import com.ryan.myblog.mapper.AiConversationMapper;
import com.ryan.myblog.mapper.AiMessageMapper;
import com.ryan.myblog.model.entity.AiConversation;
import com.ryan.myblog.service.CacheService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiConversationMemoryServiceImplTest {

    @Test
    void loadOrCreateCreatesConversationWhenMissing() {
        AiConversationMapper conversationMapper = mock(AiConversationMapper.class);
        AiMessageMapper messageMapper = mock(AiMessageMapper.class);
        CacheService cacheService = mock(CacheService.class);
        when(cacheService.get(anyString(), any())).thenReturn(null);
        when(messageMapper.selectList(any())).thenReturn(List.of());

        AiConversationMemoryServiceImpl service = new AiConversationMemoryServiceImpl(
                conversationMapper, messageMapper, cacheService);

        AiConversationMemoryService.ConversationContext context = service.loadOrCreate(null, 7L, "推荐 Spring AI 文章");

        assertNotNull(context.conversationId());
        assertEquals(7L, context.userId());
        ArgumentCaptor<AiConversation> captor = ArgumentCaptor.forClass(AiConversation.class);
        verify(conversationMapper).insert(captor.capture());
        assertEquals(7L, captor.getValue().getUserId());
        assertEquals(1, captor.getValue().getStatus());
    }
}
