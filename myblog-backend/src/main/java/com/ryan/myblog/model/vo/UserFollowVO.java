package com.ryan.myblog.model.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户关注关系视图对象
 */
@Data
public class UserFollowVO {
    
    /**
     * 用户ID
     */
    private Long userId;
    
    /**
     * 用户名
     */
    private String username;
    
    /**
     * 昵称
     */
    private String nickname;
    
    /**
     * 头像
     */
    private String avatar;
    
    /**
     * 个人简介
     */
    private String bio;
    
    /**
     * 关注时间
     */
    private LocalDateTime followTime;
    
    /**
     * 当前登录用户是否已关注此用户
     */
    private Boolean isFollowing;
}
