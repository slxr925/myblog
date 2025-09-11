package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 用户服务实现类
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    
    @Override
    public void register(UserRegisterDTO userRegisterDTO) {
        // 检查用户名是否已存在
        User existUser = userMapper.selectByUsername(userRegisterDTO.getUsername());
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }
        
        // 检查邮箱是否已存在
        existUser = userMapper.selectByEmail(userRegisterDTO.getEmail());
        if (existUser != null) {
            throw new RuntimeException("邮箱已被注册");
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(userRegisterDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userRegisterDTO.getPassword()));
        user.setEmail(userRegisterDTO.getEmail());
        user.setNickname(StringUtils.isBlank(userRegisterDTO.getNickname()) ? 
                        userRegisterDTO.getUsername() : userRegisterDTO.getNickname());
        user.setStatus(0); // 正常状态
        user.setRole(0); // 普通用户
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        
        userMapper.insert(user);
    }
    
    @Override
    public String login(UserLoginDTO userLoginDTO) {
        // 查询用户
        User user = userMapper.selectByUsername(userLoginDTO.getUsername());
        if (user == null) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(userLoginDTO.getPassword(), user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 检查用户状态
        if (user.getStatus() == 1) {
            throw new RuntimeException("用户已被禁用");
        }
        
        // 生成JWT令牌
        return jwtUtils.generateToken(user.getId(), user.getUsername());
    }
    
    @Override
    public User getUserByUsername(String username) {
        return userMapper.selectByUsername(username);
    }
    
    @Override
    public User getUserById(Long id) {
        return userMapper.selectById(id);
    }
    
    @Override
    public void updateUser(User user) {
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }
}