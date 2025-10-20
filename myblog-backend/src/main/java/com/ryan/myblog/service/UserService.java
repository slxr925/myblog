package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.model.dto.UserLoginDTO;
import com.ryan.myblog.model.dto.UserRegisterDTO;
import com.ryan.myblog.model.entity.User;

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

    /**
     * 修改密码
     */
    void changePassword(Long userId, String currentPassword, String newPassword);

    /**
     * 分页查询用户列表（管理员功能）
     */
    IPage<User> getUserPage(PageRequest pageRequest, String keyword);

    /**
     * 更新用户状态（管理员功能）
     */
    void updateUserStatus(Long userId, Integer status);

    /**
     * 获取用户总数（管理员功能）
     */
    Long getTotalUserCount(String keyword);
}