package com.ryan.myblog.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.vo.UserFollowVO;
import com.ryan.myblog.service.UserFollowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * 用户关注控制器
 */
@RestController
@RequestMapping("/api/follow")
@RequiredArgsConstructor
@Slf4j
public class UserFollowController {

    private final UserFollowService userFollowService;

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

    /**
     * 关注用户
     *
     * @param userId 要关注的用户ID
     * @return 操作结果
     */
    @PostMapping("/{userId}")
    public Result<Void> followUser(@PathVariable Long userId) {
        try {
            userFollowService.followUser(userId);
            return Result.success();
        } catch (Exception e) {
            log.error("关注用户失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取消关注用户
     *
     * @param userId 要取消关注的用户ID
     * @return 操作结果
     */
    @DeleteMapping("/{userId}")
    public Result<Void> unfollowUser(@PathVariable Long userId) {
        try {
            userFollowService.unfollowUser(userId);
            return Result.success();
        } catch (Exception e) {
            log.error("取消关注用户失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 检查是否已关注某用户
     *
     * @param userId 目标用户ID
     * @return 是否已关注
     */
    @GetMapping("/status/{userId}")
    public Result<Boolean> checkFollowStatus(@PathVariable Long userId) {
        try {
            Long currentUserId = getCurrentUserId();
            boolean isFollowing = userFollowService.isFollowing(currentUserId, userId);
            return Result.success(isFollowing);
        } catch (Exception e) {
            log.error("检查关注状态失败", e);
            // 如果用户未登录，返回false
            return Result.success(false);
        }
    }

    /**
     * 获取当前用户的粉丝列表
     *
     * @param page 页码
     * @param size 每页数量
     * @return 粉丝列表
     */
    @GetMapping("/followers")
    public Result<IPage<UserFollowVO>> getMyFollowers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Long currentUserId = getCurrentUserId();
            IPage<UserFollowVO> followers = userFollowService.getFollowers(currentUserId, page, size);
            return Result.success(followers);
        } catch (Exception e) {
            log.error("获取粉丝列表失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取指定用户的粉丝列表
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 粉丝列表
     */
    @GetMapping("/followers/{userId}")
    public Result<IPage<UserFollowVO>> getUserFollowers(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            IPage<UserFollowVO> followers = userFollowService.getFollowers(userId, page, size);
            return Result.success(followers);
        } catch (Exception e) {
            log.error("获取粉丝列表失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取当前用户的关注列表
     *
     * @param page 页码
     * @param size 每页数量
     * @return 关注列表
     */
    @GetMapping("/following")
    public Result<IPage<UserFollowVO>> getMyFollowing(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Long currentUserId = getCurrentUserId();
            IPage<UserFollowVO> following = userFollowService.getFollowing(currentUserId, page, size);
            return Result.success(following);
        } catch (Exception e) {
            log.error("获取关注列表失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取指定用户的关注列表
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 关注列表
     */
    @GetMapping("/following/{userId}")
    public Result<IPage<UserFollowVO>> getUserFollowing(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            IPage<UserFollowVO> following = userFollowService.getFollowing(userId, page, size);
            return Result.success(following);
        } catch (Exception e) {
            log.error("获取关注列表失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取当前用户的粉丝数量
     *
     * @return 粉丝数量
     */
    @GetMapping("/followers/count")
    public Result<Long> getMyFollowerCount() {
        try {
            Long currentUserId = getCurrentUserId();
            long count = userFollowService.getFollowerCount(currentUserId);
            return Result.success(count);
        } catch (Exception e) {
            log.error("获取粉丝数量失败", e);
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取当前用户的关注数量
     *
     * @return 关注数量
     */
    @GetMapping("/following/count")
    public Result<Long> getMyFollowingCount() {
        try {
            Long currentUserId = getCurrentUserId();
            long count = userFollowService.getFollowingCount(currentUserId);
            return Result.success(count);
        } catch (Exception e) {
            log.error("获取关注数量失败", e);
            return Result.error(e.getMessage());
        }
    }
}
