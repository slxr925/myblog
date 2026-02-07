package com.ryan.myblog.service;

import java.util.List;

/**
 * 用户屏蔽服务
 */
public interface UserBlockService {

    void blockUser(Long blockerId, Long blockedId);

    void unblockUser(Long blockerId, Long blockedId);

    boolean isBlocked(Long blockerId, Long blockedId);

    List<Long> getBlockedUserIds(Long blockerId);
}
