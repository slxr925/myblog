package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.JwtUtils;
import com.ryan.myblog.utils.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 用户服务实现类
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    
    @Override
    @Transactional
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

        // 验证密码强度（生产环境使用完整验证）
        String activeProfile = System.getProperty("spring.profiles.active", "dev");
        boolean isProduction = "prod".equalsIgnoreCase(activeProfile);

        PasswordValidator.PasswordValidationResult passwordResult;
        if (isProduction) {
            // 生产环境使用完整验证
            passwordResult = PasswordValidator.validate(
                    userRegisterDTO.getPassword(),
                    userRegisterDTO.getUsername(),
                    userRegisterDTO.getEmail()
            );
        } else {
            // 开发环境使用基础验证
            passwordResult = PasswordValidator.validateBasic(userRegisterDTO.getPassword());
        }

        if (!passwordResult.isValid()) {
            throw new RuntimeException(passwordResult.getMessage());
        }

        // 创建新用户
        User user = new User();
        user.setUsername(userRegisterDTO.getUsername());
        user.setPassword(passwordEncoder.encode(userRegisterDTO.getPassword()));
        user.setEmail(userRegisterDTO.getEmail());
        user.setNickname(StringUtils.isBlank(userRegisterDTO.getNickname()) ?
                userRegisterDTO.getUsername() : userRegisterDTO.getNickname());
        user.setStatus(0); // 正常状态
        user.setRole(userRegisterDTO.getRole() != null ? userRegisterDTO.getRole() : 0); // 使用传入的角色，默认为普通用户
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());

        userMapper.insert(user);
        log.info("用户注册成功：{}，密码强度：{}", userRegisterDTO.getUsername(), passwordResult.getMessage());
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
    @Transactional
    public void updateUser(User user) {
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
    }
}