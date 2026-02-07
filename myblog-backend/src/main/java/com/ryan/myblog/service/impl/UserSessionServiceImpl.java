package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ryan.myblog.mapper.UserSessionMapper;
import com.ryan.myblog.model.entity.UserSession;
import com.ryan.myblog.model.vo.UserSessionVO;
import com.ryan.myblog.service.UserSessionService;
import com.ryan.myblog.utils.UserAgentUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionServiceImpl extends ServiceImpl<UserSessionMapper, UserSession> implements UserSessionService {

    private final UserSessionMapper userSessionMapper;

    @Override
    public UserSession createSession(Long userId, String refreshJti, String ip, String userAgent, String deviceLabel,
                                     LocalDateTime expiresTime) {
        UserSession session = new UserSession();
        session.setUserId(userId);
        session.setRefreshJti(refreshJti);
        session.setIp(ip);
        session.setUserAgent(userAgent);
        session.setDeviceLabel(deviceLabel != null ? deviceLabel : UserAgentUtils.toDeviceLabel(userAgent));
        session.setLastSeenTime(LocalDateTime.now());
        session.setExpiresTime(expiresTime);
        session.setRevoked(0);
        userSessionMapper.insert(session);
        return session;
    }

    @Override
    public boolean isSessionActive(Long sessionId, Long userId) {
        UserSession session = userSessionMapper.selectById(sessionId);
        if (session == null) {
            return false;
        }
        if (userId != null && !userId.equals(session.getUserId())) {
            return false;
        }
        if (session.getRevoked() != null && session.getRevoked() == 1) {
            return false;
        }
        return session.getExpiresTime() == null || session.getExpiresTime().isAfter(LocalDateTime.now());
    }

    @Override
    public void touchSession(Long sessionId, String ip, String userAgent) {
        UserSession session = userSessionMapper.selectById(sessionId);
        if (session == null) {
            return;
        }
        session.setLastSeenTime(LocalDateTime.now());
        if (ip != null) {
            session.setIp(ip);
        }
        if (userAgent != null) {
            session.setUserAgent(userAgent);
            session.setDeviceLabel(UserAgentUtils.toDeviceLabel(userAgent));
        }
        userSessionMapper.updateById(session);
    }

    @Override
    public boolean rotateRefreshToken(Long sessionId, String newJti, LocalDateTime newExpiresTime) {
        UserSession session = userSessionMapper.selectById(sessionId);
        if (session == null) {
            return false;
        }
        session.setRefreshJti(newJti);
        session.setExpiresTime(newExpiresTime);
        session.setLastSeenTime(LocalDateTime.now());
        return userSessionMapper.updateById(session) > 0;
    }

    @Override
    public void revokeSession(Long sessionId, Long userId) {
        UserSession session = userSessionMapper.selectById(sessionId);
        if (session == null) {
            return;
        }
        if (userId != null && !userId.equals(session.getUserId())) {
            return;
        }
        session.setRevoked(1);
        userSessionMapper.updateById(session);
    }

    @Override
    public void revokeAllSessions(Long userId) {
        if (userId == null) {
            return;
        }
        LambdaQueryWrapper<UserSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserSession::getUserId, userId).eq(UserSession::getRevoked, 0);
        List<UserSession> sessions = userSessionMapper.selectList(wrapper);
        for (UserSession session : sessions) {
            session.setRevoked(1);
            userSessionMapper.updateById(session);
        }
        log.warn("已吊销用户所有会话: {}", userId);
    }

    @Override
    public List<UserSessionVO> listSessions(Long userId) {
        LambdaQueryWrapper<UserSession> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserSession::getUserId, userId).orderByDesc(UserSession::getLastSeenTime);
        List<UserSession> sessions = userSessionMapper.selectList(wrapper);
        return sessions.stream().map(this::toVO).collect(Collectors.toList());
    }

    @Override
    public UserSession getSession(Long sessionId) {
        return userSessionMapper.selectById(sessionId);
    }

    private UserSessionVO toVO(UserSession session) {
        UserSessionVO vo = new UserSessionVO();
        vo.setSessionId(session.getId());
        vo.setIp(session.getIp());
        vo.setUserAgent(session.getUserAgent());
        vo.setDeviceLabel(session.getDeviceLabel());
        vo.setLastSeen(session.getLastSeenTime());
        vo.setCreatedAt(session.getCreateTime());
        vo.setStatus(session.getRevoked() != null ? session.getRevoked() : 0);
        return vo;
    }
}
