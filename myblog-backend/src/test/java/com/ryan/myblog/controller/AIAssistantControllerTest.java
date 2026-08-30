package com.ryan.myblog.controller;

import com.ryan.myblog.model.dto.AIChatRequest;
import com.ryan.myblog.service.AIAssistantService;
import com.ryan.myblog.service.AiAction;
import com.ryan.myblog.service.AiQuotaReservation;
import com.ryan.myblog.service.AiStreamLifecycle;
import com.ryan.myblog.service.AiUsageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AIAssistantControllerTest {

    @Mock
    private AIAssistantService aiAssistantService;

    @Mock
    private AiUsageService aiUsageService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void streamChatReservesQuotaAndConfirmsOnSuccess() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        42L, null, List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        AIAssistantController controller = new AIAssistantController(aiAssistantService, aiUsageService);
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("你好");
        SseEmitter emitter = new SseEmitter();
        AiQuotaReservation reservation = new AiQuotaReservation(
                "request-1", 42L, LocalDate.now(), AiAction.CHAT, 1, false);

        when(aiUsageService.reserve("request-1", 42L, AiAction.CHAT, 1, false)).thenReturn(reservation);
        when(aiAssistantService.streamChat(eq(request), any(AiStreamLifecycle.class))).thenReturn(emitter);

        SseEmitter result = controller.streamChat(request, "request-1");

        assertSame(emitter, result);
        ArgumentCaptor<AiStreamLifecycle> lifecycleCaptor = ArgumentCaptor.forClass(AiStreamLifecycle.class);
        verify(aiAssistantService).streamChat(eq(request), lifecycleCaptor.capture());
        lifecycleCaptor.getValue().onSuccess();
        verify(aiUsageService).confirm("request-1");
    }

    @Test
    void administratorReservationIsUnlimited() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        7L, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        AIAssistantController controller = new AIAssistantController(aiAssistantService, aiUsageService);
        AIChatRequest request = new AIChatRequest();
        request.setQuestion("测试");
        AiQuotaReservation reservation = new AiQuotaReservation(
                "admin-request", 7L, LocalDate.now(), AiAction.CHAT, 1, true);
        when(aiUsageService.reserve("admin-request", 7L, AiAction.CHAT, 1, true)).thenReturn(reservation);
        when(aiAssistantService.streamChat(eq(request), any(AiStreamLifecycle.class))).thenReturn(new SseEmitter());

        controller.streamChat(request, "admin-request");

        verify(aiUsageService).reserve("admin-request", 7L, AiAction.CHAT, 1, true);
    }
}
