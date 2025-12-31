package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ryan.myblog.event.NotificationEvent;
import com.ryan.myblog.mapper.UserFollowMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.model.entity.UserFollow;
import com.ryan.myblog.model.vo.UserFollowVO;
import com.ryan.myblog.service.UserFollowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户关注服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserFollowServiceImpl extends ServiceImpl<UserFollowMapper, UserFollow>
        implements UserFollowService {

    private final UserFollowMapper userFollowMapper;
    private final UserMapper userMapper;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 获取当前登录用户ID
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userId;
        }
        throw new RuntimeException("用户未登录");
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void followUser(Long followeeId) {
        Long followerId = getCurrentUserId();

        // 防止用户关注自己
        if (followerId.equals(followeeId)) {
            throw new RuntimeException("不能关注自己");
        }

        // 检查被关注用户是否存在
        User followee = userMapper.selectById(followeeId);
        if (followee == null || followee.getDeleted() == 1) {
            throw new RuntimeException("用户不存在");
        }

        // 检查是否已经关注
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFolloweeId, followeeId)
                .eq(UserFollow::getDeleted, 0);

        UserFollow existing = getOne(wrapper);

        if (existing != null) {
            // 已经关注，不做处理
            return;
        }

        // 物理删除所有旧记录（绕过逻辑删除）
        userFollowMapper.physicalDeleteByFollowerAndFollowee(followerId, followeeId);

        // 创建新的关注记录
        UserFollow userFollow = new UserFollow();
        userFollow.setFollowerId(followerId);
        userFollow.setFolloweeId(followeeId);
        save(userFollow);

        // 发送关注通知
        User follower = userMapper.selectById(followerId);
        String followerName = follower != null ? follower.getNickname() : "有人";
        NotificationEvent event = NotificationEvent.followEvent(
                this, followeeId, followerId, followerName,
                java.util.Map.of("followerAvatar",
                        follower != null && follower.getAvatar() != null ? follower.getAvatar() : ""));
        eventPublisher.publishEvent(event);

        log.info("用户 {} 关注了用户 {}", followerId, followeeId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unfollowUser(Long followeeId) {
        Long followerId = getCurrentUserId();

        // 查找关注记录
        LambdaQueryWrapper<UserFollow> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFolloweeId, followeeId)
                .eq(UserFollow::getDeleted, 0);

        UserFollow userFollow = getOne(queryWrapper);

        if (userFollow == null) {
            throw new RuntimeException("未关注该用户");
        }

        // 使用原生SQL物理删除，绕过MyBatis Plus全局逻辑删除配置
        userFollowMapper.physicalDeleteById(userFollow.getId());
        log.info("用户 {} 取消关注用户 {}", followerId, followeeId);
    }

    @Override
    public boolean isFollowing(Long followerId, Long followeeId) {
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFollowerId, followerId)
                .eq(UserFollow::getFolloweeId, followeeId)
                .eq(UserFollow::getDeleted, 0);

        return count(wrapper) > 0;
    }

    @Override
    public IPage<UserFollowVO> getFollowers(Long userId, int page, int size) {
        Page<UserFollow> pageParam = new Page<>(page, size);

        // 查询关注该用户的所有用户（粉丝列表）
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFolloweeId, userId)
                .eq(UserFollow::getDeleted, 0)
                .orderByDesc(UserFollow::getCreateTime);

        IPage<UserFollow> followPage = page(pageParam, wrapper);

        // 转换为VO对象
        Page<UserFollowVO> voPage = new Page<>(page, size);
        voPage.setTotal(followPage.getTotal());

        Long currentUserId = null;
        try {
            currentUserId = getCurrentUserId();
        } catch (Exception e) {
            // 未登录用户，currentUserId 为 null
        }

        final Long finalCurrentUserId = currentUserId;

        voPage.setRecords(
                followPage.getRecords().stream()
                        .map(follow -> {
                            User follower = userMapper.selectById(follow.getFollowerId());
                            if (follower == null) {
                                return null;
                            }

                            UserFollowVO vo = new UserFollowVO();
                            vo.setUserId(follower.getId());
                            vo.setUsername(follower.getUsername());
                            vo.setNickname(follower.getNickname());
                            vo.setAvatar(follower.getAvatar());
                            vo.setBio(follower.getBio());
                            vo.setFollowTime(follow.getCreateTime());

                            // 设置当前用户是否已关注此粉丝
                            if (finalCurrentUserId != null) {
                                vo.setIsFollowing(isFollowing(finalCurrentUserId, follower.getId()));
                            } else {
                                vo.setIsFollowing(false);
                            }

                            return vo;
                        })
                        .filter(vo -> vo != null)
                        .toList());

        return voPage;
    }

    @Override
    public IPage<UserFollowVO> getFollowing(Long userId, int page, int size) {
        Page<UserFollow> pageParam = new Page<>(page, size);

        // 查询该用户关注的所有用户（关注列表）
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFollowerId, userId)
                .eq(UserFollow::getDeleted, 0)
                .orderByDesc(UserFollow::getCreateTime);

        IPage<UserFollow> followPage = page(pageParam, wrapper);

        // 转换为VO对象
        Page<UserFollowVO> voPage = new Page<>(page, size);
        voPage.setTotal(followPage.getTotal());

        Long currentUserId = null;
        try {
            currentUserId = getCurrentUserId();
        } catch (Exception e) {
            // 未登录用户，currentUserId 为 null
        }

        final Long finalCurrentUserId = currentUserId;

        voPage.setRecords(
                followPage.getRecords().stream()
                        .map(follow -> {
                            User followee = userMapper.selectById(follow.getFolloweeId());
                            if (followee == null) {
                                return null;
                            }

                            UserFollowVO vo = new UserFollowVO();
                            vo.setUserId(followee.getId());
                            vo.setUsername(followee.getUsername());
                            vo.setNickname(followee.getNickname());
                            vo.setAvatar(followee.getAvatar());
                            vo.setBio(followee.getBio());
                            vo.setFollowTime(follow.getCreateTime());

                            // 对于关注列表，当前用户肯定已关注这些用户
                            if (finalCurrentUserId != null && finalCurrentUserId.equals(userId)) {
                                vo.setIsFollowing(true);
                            } else if (finalCurrentUserId != null) {
                                vo.setIsFollowing(isFollowing(finalCurrentUserId, followee.getId()));
                            } else {
                                vo.setIsFollowing(false);
                            }

                            return vo;
                        })
                        .filter(vo -> vo != null)
                        .toList());

        return voPage;
    }

    @Override
    public long getFollowerCount(Long userId) {
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFolloweeId, userId)
                .eq(UserFollow::getDeleted, 0);
        return count(wrapper);
    }

    @Override
    public long getFollowingCount(Long userId) {
        LambdaQueryWrapper<UserFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(UserFollow::getFollowerId, userId)
                .eq(UserFollow::getDeleted, 0);
        return count(wrapper);
    }
}
