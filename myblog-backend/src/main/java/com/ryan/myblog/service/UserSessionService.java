package com.ryan.myblog.service;

import com.ryan.myblog.model.entity.UserSession;
import com.ryan.myblog.model.vo.UserSessionVO;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 用户会话服务
 */
public interface UserSessionService {

    UserSession createSession(Long userId, String refreshJti, String ip, String userAgent, String deviceLabel,
                              LocalDateTime expiresTime);

    boolean isSessionActive(Long sessionId, Long userId);

    void touchSession(Long sessionId, String ip, String userAgent);

    boolean rotateRefreshToken(Long sessionId, String newJti, LocalDateTime newExpiresTime);

    void revokeSession(Long sessionId, Long userId);

    void revokeAllSessions(Long userId);

    List<UserSessionVO> listSessions(Long userId);

    UserSession getSession(Long sessionId);
}
