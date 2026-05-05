package com.ryan.myblog.controller;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.service.AIAssistantService;
import com.ryan.myblog.service.AiUsageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIAssistantControllerTest {

    @Mock
    private AIAssistantService aiAssistantService;

    @Mock
    private AiUsageService aiUsageService;

    @Test
    void streamChatChecksQuotaAndDelegatesToAssistantService() {
        AIAssistantController controller = new AIAssistantController(aiAssistantService, aiUsageService);
        ReflectionTestUtils.setField(controller, "maxRequestsPerDay", 50);
        ReflectionTestUtils.setField(controller, "maxTokensPerDay", 50000);
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("你好");
        SseEmitter emitter = new SseEmitter();

        when(aiUsageService.checkAndConsume(isNull(), anyInt(), anyInt(), anyInt())).thenReturn(true);
        when(aiAssistantService.streamChat(any(AIChatRequest.class))).thenReturn(emitter);

        SseEmitter result = controller.streamChat(request);

        assertSame(emitter, result);
        verify(aiUsageService).checkAndConsume(null, 1, 50, 50000);
        verify(aiAssistantService).streamChat(request);
    }
}
