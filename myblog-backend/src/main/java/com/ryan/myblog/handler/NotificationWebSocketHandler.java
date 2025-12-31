package com.ryan.myblog.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.model.vo.NotificationVO;
import com.ryan.myblog.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 通知WebSocket处理器
 * 管理WebSocket连接，支持实时推送通知
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final JwtUtils jwtUtils;
    private final ObjectMapper objectMapper;

    /**
     * 用户ID -> WebSocket会话 映射
     * 支持同一用户多个连接（多设备）
     */
    private final Map<Long, ConcurrentHashMap<String, WebSocketSession>> userSessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        Long userId = getUserIdFromSession(session);
        if (userId == null) {
            log.warn("WebSocket连接失败: 无法解析用户ID");
            session.close(CloseStatus.POLICY_VIOLATION);
            return;
        }

        userSessions.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                .put(session.getId(), session);

        log.info("WebSocket连接建立: userId={}, sessionId={}, 当前连接数={}",
                userId, session.getId(), getTotalConnections());

        // 发送欢迎消息
        sendMessage(session, Map.of(
                "type", "CONNECTED",
                "message", "通知服务已连接",
                "userId", userId));
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Long userId = getUserIdFromSession(session);
        if (userId != null) {
            ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session.getId());
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
        }

        log.info("WebSocket连接关闭: userId={}, sessionId={}, status={}",
                userId, session.getId(), status);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        // 处理客户端发送的消息（如心跳、标记已读等）
        String payload = message.getPayload();
        log.debug("收到WebSocket消息: sessionId={}, payload={}", session.getId(), payload);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(payload, Map.class);
            String type = (String) data.get("type");

            if ("PING".equals(type)) {
                sendMessage(session, Map.of("type", "PONG"));
            }
            // 可以添加更多消息类型处理
        } catch (Exception e) {
            log.warn("解析WebSocket消息失败: {}", e.getMessage());
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("WebSocket传输错误: sessionId={}, error={}",
                session.getId(), exception.getMessage());
    }

    /**
     * 向指定用户推送通知
     * 
     * @param userId       用户ID
     * @param notification 通知VO
     */
    public void sendNotification(Long userId, NotificationVO notification) {
        ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            log.debug("用户不在线,跳过WebSocket推送: userId={}", userId);
            return;
        }

        Map<String, Object> message = Map.of(
                "type", "NOTIFICATION",
                "data", notification);

        sessions.values().forEach(session -> {
            if (session.isOpen()) {
                sendMessage(session, message);
            }
        });

        log.info("WebSocket通知已推送: userId={}, notificationId={}, sessions={}",
                userId, notification.getId(), sessions.size());
    }

    /**
     * 向指定用户推送未读数量更新
     */
    public void sendUnreadCount(Long userId, Long count) {
        ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        Map<String, Object> message = Map.of(
                "type", "UNREAD_COUNT",
                "count", count);

        sessions.values().forEach(session -> {
            if (session.isOpen()) {
                sendMessage(session, message);
            }
        });
    }

    /**
     * 发送消息到WebSocket会话
     */
    private void sendMessage(WebSocketSession session, Object data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            session.sendMessage(new TextMessage(json));
        } catch (IOException e) {
            log.error("发送WebSocket消息失败: sessionId={}, error={}",
                    session.getId(), e.getMessage());
        }
    }

    /**
     * 从WebSocket会话中提取用户ID
     * 通过URL参数中的token解析
     */
    private Long getUserIdFromSession(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri == null) {
                log.warn("WebSocket连接失败: URI为空");
                return null;
            }

            String query = uri.getQuery();
            if (query == null) {
                log.warn("WebSocket连接失败: Query为空");
                return null;
            }

            log.debug("尝试从WebSocket URI解析用户: query={}", query);

            // 解析 ?token=xxx
            for (String param : query.split("&")) {
                String[] pair = param.split("=");
                if (pair.length == 2 && "token".equals(pair[0])) {
                    String token = pair[1];
                    log.debug("找到Token: {}", token.substring(0, Math.min(token.length(), 10)) + "...");

                    if (jwtUtils.validateToken(token)) {
                        Long userId = jwtUtils.getUserIdFromToken(token);
                        log.debug("Token校验成功: userId={}", userId);
                        return userId;
                    } else {
                        log.warn("WebSocket Token校验失败: token无效或已过期");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("解析WebSocket用户ID过程出错: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 获取当前总连接数
     */
    private int getTotalConnections() {
        return userSessions.values().stream()
                .mapToInt(ConcurrentHashMap::size)
                .sum();
    }

    /**
     * 检查用户是否在线
     */
    public boolean isUserOnline(Long userId) {
        ConcurrentHashMap<String, WebSocketSession> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }
}
