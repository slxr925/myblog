package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.config.JwtProperties;
import com.ryan.myblog.model.dto.TokenResponse;
import com.ryan.myblog.model.dto.UserLoginDTO;
import com.ryan.myblog.model.dto.UserRegisterDTO;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.SessionService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.JwtUtils;
import com.ryan.myblog.utils.PasswordValidator;
import com.ryan.myblog.common.RedisKeyFactory;
import com.ryan.myblog.service.UnifiedCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

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
    private final JwtProperties jwtProperties;
    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheService cacheService;
    private final UnifiedCacheService unifiedCacheService;
    private final CacheConsistencyService cacheConsistencyService;

    // 登录失败限制配置
    private static final int MAX_LOGIN_ATTEMPTS = 5; // 最大失败次数
    private static final long LOCK_DURATION_MINUTES = 10; // 锁定时长（分钟）
    private static final String LOGIN_FAIL_KEY_PREFIX = "login:fail:";
    private static final String LOGIN_LOCK_KEY_PREFIX = "login:locked:";

    @Override
    @Transactional
    public void register(UserRegisterDTO userRegisterDTO) {
        // 检查用户名是否已存在
        User existUser = userMapper.selectByUsername(userRegisterDTO.getUsername());
        if (existUser != null) {
            throw new RuntimeException("用户名已存在");
        }

        // 昵称不进行唯一性校验

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
                    userRegisterDTO.getEmail());
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
        user.setNickname(StringUtils.isBlank(userRegisterDTO.getNickname()) ? userRegisterDTO.getUsername()
                : userRegisterDTO.getNickname());
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
    public TokenResponse loginWithTokens(UserLoginDTO userLoginDTO, String clientIp) {
        log.info("用户登录请求（双Token）：{}，IP：{}", userLoginDTO.getUsername(), clientIp);

        String username = userLoginDTO.getUsername();

        // 1. 检查IP是否被锁定
        String ipLockKey = LOGIN_LOCK_KEY_PREFIX + "ip:" + clientIp;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(ipLockKey))) {
            Long ttl = redisTemplate.getExpire(ipLockKey, TimeUnit.MINUTES);
            log.warn("IP已被锁定：{}，剩余时间：{}分钟", clientIp, ttl);
            throw new RuntimeException("登录失败次数过多，请" + ttl + "分钟后再试");
        }

        // 2. 检查用户是否被锁定
        String userLockKey = RedisKeyFactory.USER_LOGIN_LOCK.getKey(username);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(userLockKey))) {
            Long ttl = redisTemplate.getExpire(userLockKey, TimeUnit.MINUTES);
            log.warn("用户已被锁定：{}，剩余时间：{}分钟", username, ttl);
            throw new RuntimeException("该账号已被锁定，请" + ttl + "分钟后再试");
        }

        // 3. 查询用户
        User user = userMapper.selectByUsername(username);
        if (user == null) {
            log.warn("用户不存在：{}", username);
            handleLoginFailure(username, clientIp);
            throw new RuntimeException("用户名或密码错误");
        }

        // 4. 验证密码
        if (!passwordEncoder.matches(userLoginDTO.getPassword(), user.getPassword())) {
            log.warn("密码错误：{}", username);
            handleLoginFailure(username, clientIp);
            throw new RuntimeException("用户名或密码错误");
        }

        // 5. 检查用户状态
        if (user.getStatus() == 1) {
            log.warn("用户已被禁用：{}", username);
            throw new RuntimeException("用户已被禁用");
        }

        // 6. 登录成功，清除失败记录
        clearLoginFailures(username, clientIp);

        // 7. 生成Access Token（管理员token绑定IP）
        String accessToken = jwtUtils.generateAccessToken(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                clientIp);

        // 8. 生成Refresh Token
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        // 9. 保存用户会话到Redis
        sessionService.saveSession(accessToken, user.getId());

        log.info("用户登录成功：{}，角色：{}，accessToken长度：{}，refreshToken长度：{}",
                username, user.getRole(), accessToken.length(), refreshToken.length());

        return new TokenResponse(accessToken, refreshToken, jwtProperties.getAccessTokenExpiration());
    }

    /**
     * 处理登录失败
     * 记录失败次数，超过阈值则锁定
     */
    private void handleLoginFailure(String username, String clientIp) {
        // 记录IP失败次数
        String ipFailKey = LOGIN_FAIL_KEY_PREFIX + "ip:" + clientIp;
        Integer ipFailCount = incrementFailCount(ipFailKey);

        // 记录用户失败次数
        String userFailKey = RedisKeyFactory.USER_LOGIN_FAIL.getKey(username);
        Integer userFailCount = incrementFailCount(userFailKey);

        log.info("登录失败 - 用户：{}，IP：{}，IP失败次数：{}，用户失败次数：{}",
                username, clientIp, ipFailCount, userFailCount);

        // 检查是否需要锁定
        if (ipFailCount >= MAX_LOGIN_ATTEMPTS) {
            lockAccount(LOGIN_LOCK_KEY_PREFIX + "ip:" + clientIp);
            log.warn("IP已被锁定：{}，锁定时长：{}分钟", clientIp, LOCK_DURATION_MINUTES);
        }

        if (userFailCount >= MAX_LOGIN_ATTEMPTS) {
            lockAccount(RedisKeyFactory.USER_LOGIN_LOCK.getKey(username));
            log.warn("用户已被锁定：{}，锁定时长：{}分钟", username, LOCK_DURATION_MINUTES);
        }
    }

    /**
     * 递增失败计数
     * 
     * @return 当前失败次数
     */
    private Integer incrementFailCount(String key) {
        Long count = redisTemplate.opsForValue().increment(key);
        // 设置失败记录过期时间为锁定时长
        redisTemplate.expire(key, LOCK_DURATION_MINUTES, TimeUnit.MINUTES);
        return count != null ? count.intValue() : 1;
    }

    /**
     * 锁定账号
     */
    private void lockAccount(String lockKey) {
        redisTemplate.opsForValue().set(lockKey, "locked", LOCK_DURATION_MINUTES, TimeUnit.MINUTES);
    }

    /**
     * 清除登录失败记录
     */
    private void clearLoginFailures(String username, String clientIp) {
        String ipFailKey = LOGIN_FAIL_KEY_PREFIX + "ip:" + clientIp;
        String userFailKey = RedisKeyFactory.USER_LOGIN_FAIL.getKey(username);

        redisTemplate.delete(ipFailKey);
        redisTemplate.delete(userFailKey);

        log.debug("清除登录失败记录 - 用户：{}，IP：{}", username, clientIp);
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
        User existingUser = userMapper.selectById(user.getId());
        if (existingUser == null) {
            throw new RuntimeException("用户不存在");
        }

        boolean nicknameChanged = StringUtils.isNotBlank(user.getNickname())
                && !user.getNickname().equals(existingUser.getNickname());

        user.setUpdateTime(LocalDateTime.now());
        userMapper.updateById(user);

        if (nicknameChanged) {
            unifiedCacheService.deleteByPattern(RedisKeyFactory.BLOG_DETAIL);
            unifiedCacheService.deleteByPattern(RedisKeyFactory.BLOG_HOT_LIST);
            unifiedCacheService.deleteByPattern(RedisKeyFactory.BLOG_LATEST_LIST);
            cacheService.deleteByPattern("blog:page:*");
            cacheConsistencyService.publishCacheInvalidation("blog:*", "用户昵称更新");
            log.info("用户昵称更新，已清除相关博客缓存：userId={}", user.getId());
        }
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
            queryWrapper.and(wrapper -> wrapper.like(User::getUsername, keyword)
                    .or()
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getEmail, keyword));
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

        // 防止禁用任何管理员账户
        if (user.getRole() != null && user.getRole() == 1) {
            throw new RuntimeException("不能禁用管理员账户");
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
            queryWrapper.and(wrapper -> wrapper.like(User::getUsername, keyword)
                    .or()
                    .like(User::getNickname, keyword)
                    .or()
                    .like(User::getEmail, keyword));
        }

        queryWrapper.select(User::getId); // 只查询ID，提高性能

        Long count = userMapper.selectCount(queryWrapper);
        log.info("用户总数：{}", count);

        return count;
    }
}