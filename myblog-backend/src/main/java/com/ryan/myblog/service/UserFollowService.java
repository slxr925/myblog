package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.model.vo.UserFollowVO;

/**
 * 用户关注服务接口
 */
public interface UserFollowService {
    
    /**
     * 关注用户
     *
     * @param followeeId 被关注用户ID
     */
    void followUser(Long followeeId);
    
    /**
     * 取消关注
     *
     * @param followeeId 被关注用户ID
     */
    void unfollowUser(Long followeeId);
    
    /**
     * 检查是否已关注
     *
     * @param followerId 关注者ID
     * @param followeeId 被关注者ID
     * @return 是否已关注
     */
    boolean isFollowing(Long followerId, Long followeeId);
    
    /**
     * 获取粉丝列表（关注我的人）
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 粉丝列表
     */
    IPage<UserFollowVO> getFollowers(Long userId, int page, int size);
    
    /**
     * 获取关注列表（我关注的人）
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 关注列表
     */
    IPage<UserFollowVO> getFollowing(Long userId, int page, int size);
    
    /**
     * 获取粉丝数量
     *
     * @param userId 用户ID
     * @return 粉丝数量
     */
    long getFollowerCount(Long userId);
    
    /**
     * 获取关注数量
     *
     * @param userId 用户ID
     * @return 关注数量
     */
    long getFollowingCount(Long userId);
}
