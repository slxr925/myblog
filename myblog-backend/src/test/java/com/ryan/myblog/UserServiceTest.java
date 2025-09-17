package com.ryan.myblog.test;

import com.ryan.myblog.service.UserService;
import com.ryan.myblog.dto.UserLoginDTO;
import com.ryan.myblog.dto.UserRegisterDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 用户服务测试
 */
@Component
public class UserServiceTest implements CommandLineRunner {
    
    @Autowired
    private UserService userService;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("=== 开始用户服务测试 ===");
        
        try {
            // 测试注册新用户
            System.out.println("1. 测试用户注册...");
            UserRegisterDTO registerDTO = new UserRegisterDTO();
            registerDTO.setUsername("testuser2");
            registerDTO.setPassword("password123");
            registerDTO.setEmail("testuser2@example.com");
            registerDTO.setNickname("测试用户2");
            
            userService.register(registerDTO);
            System.out.println("✅ 用户注册成功");
            
            // 测试登录
            System.out.println("2. 测试用户登录...");
            UserLoginDTO loginDTO = new UserLoginDTO();
            loginDTO.setUsername("testuser2");
            loginDTO.setPassword("password123");
            
            String token = userService.login(loginDTO);
            System.out.println("✅ 用户登录成功，Token: " + token.substring(0, 50) + "...");
            
            // 测试已有用户登录
            System.out.println("3. 测试已有用户登录...");
            UserLoginDTO existingLoginDTO = new UserLoginDTO();
            existingLoginDTO.setUsername("testuser");
            existingLoginDTO.setPassword("user123");
            
            String existingToken = userService.login(existingLoginDTO);
            System.out.println("✅ 已有用户登录成功，Token: " + existingToken.substring(0, 50) + "...");
            
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("=== 用户服务测试完成 ===");
    }
}