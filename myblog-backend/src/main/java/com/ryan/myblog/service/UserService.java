package com.ryan.myblog.service;

import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;

/**
 * 用户服务接口
 */
public interface UserService {
    
    /**
     * 用户注册
     */
    void register(UserRegisterDTO userRegisterDTO);
    
    /**
     * 用户登录
     */
    String login(UserLoginDTO userLoginDTO);
    
    /**
     * 根据用户名查询用户
     */
    User getUserByUsername(String username);
    
    /**
     * 根据ID查询用户
     */
    User getUserById(Long id);
    
    /**
     * 更新用户信息
     */
    void updateUser(User user);
}