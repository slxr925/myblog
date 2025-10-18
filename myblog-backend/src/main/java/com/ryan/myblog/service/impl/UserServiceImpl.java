package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.service.SessionService;
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
    private final SessionService sessionService;
    
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
        log.info("用户登录请求：{}", userLoginDTO.getUsername());
        
        // 查询用户
        User user = userMapper.selectByUsername(userLoginDTO.getUsername());
        if (user == null) {
            log.warn("用户不存在：{}", userLoginDTO.getUsername());
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(userLoginDTO.getPassword(), user.getPassword())) {
            log.warn("密码错误：{}", userLoginDTO.getUsername());
            throw new RuntimeException("用户名或密码错误");
        }
        
        // 检查用户状态
        if (user.getStatus() == 1) {
            log.warn("用户已被禁用：{}", userLoginDTO.getUsername());
            throw new RuntimeException("用户已被禁用");
        }
        
        // 生成JWT令牌
        String token = jwtUtils.generateToken(user.getId(), user.getUsername());
        
        // 保存用户会话到Redis
        sessionService.saveSession(token, user.getId());
        
        log.info("用户登录成功：{}，token长度：{}", userLoginDTO.getUsername(), token.length());
        return token;
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
    
    @Override
    @Transactional
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        // 获取用户信息
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 验证当前密码
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("当前密码错误");
        }
        
        // 验证新密码是否与原密码相同
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("新密码不能与原密码相同");
        }
        
        // 验证新密码强度
        PasswordValidator.PasswordValidationResult passwordResult = PasswordValidator.validateBasic(newPassword);
        if (!passwordResult.isValid()) {
            throw new RuntimeException(passwordResult.getMessage());
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);
        
        log.info("用户密码修改成功：{}", user.getUsername());
    }

    @Override
    public IPage<User> getUserPage(PageRequest pageRequest, String keyword) {
        log.info("分页查询用户列表：page={}, size={}, keyword={}",
                pageRequest.getPage(), pageRequest.getSize(), keyword);

        // 创建分页对象
        Page<User> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());

        // 构建查询条件
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();

        // 添加关键词搜索（用户名、昵称、邮箱）
        if (StringUtils.isNotBlank(keyword)) {
            queryWrapper.and(wrapper ->
                wrapper.like(User::getUsername, keyword)
                       .or()
                       .like(User::getNickname, keyword)
                       .or()
                       .like(User::getEmail, keyword)
            );
        }

        // 按创建时间倒序排列
        queryWrapper.orderByDesc(User::getCreateTime);

        // 执行分页查询
        IPage<User> result = userMapper.selectPage(page, queryWrapper);

        log.info("分页查询用户列表完成：total={}, pages={}, current={}",
                result.getTotal(), result.getPages(), result.getCurrent());

        return result;
    }

    @Override
    @Transactional
    public void updateUserStatus(Long userId, Integer status) {
        log.info("更新用户状态：userId={}, status={}", userId, status);

        // 检查用户是否存在
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 防止管理员禁用自己
        try {
            Long currentUserId = com.ryan.myblog.utils.SecurityUtils.getCurrentUserId();
            if (currentUserId != null && currentUserId.equals(userId)) {
                throw new RuntimeException("不能修改自己的状态");
            }
        } catch (Exception e) {
            log.warn("获取当前用户ID失败", e);
        }

        // 更新用户状态
        user.setStatus(status);
        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);

        String statusText = status == 0 ? "启用" : "禁用";
        log.info("用户状态更新成功：userId={}, username={}, status={}",
                userId, user.getUsername(), statusText);
    }

    @Override
    public Long getTotalUserCount(String keyword) {
        log.info("获取用户总数，关键词：{}", keyword);

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();

        // 添加关键词搜索（用户名、昵称、邮箱）
        if (StringUtils.isNotBlank(keyword)) {
            queryWrapper.and(wrapper ->
                wrapper.like(User::getUsername, keyword)
                       .or()
                       .like(User::getNickname, keyword)
                       .or()
                       .like(User::getEmail, keyword)
            );
        }

        queryWrapper.select(User::getId); // 只查询ID，提高性能

        Long count = userMapper.selectCount(queryWrapper);
        log.info("用户总数：{}", count);

        return count;
    }
}