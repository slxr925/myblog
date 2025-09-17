package com.ryan.myblog;

import com.ryan.myblog.service.UserService;
import com.ryan.myblog.dto.UserLoginDTO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.config.name=application-test")
public class UserLoginTest {

    @Autowired
    private UserService userService;

    @Test
    public void testUserLogin() {
        System.out.println("=== 测试用户登录 ===");
        
        try {
            // 测试管理员登录
            System.out.println("1. 测试管理员登录...");
            UserLoginDTO adminLoginDTO = new UserLoginDTO();
            adminLoginDTO.setUsername("admin");
            adminLoginDTO.setPassword("admin123");
            
            String adminToken = userService.login(adminLoginDTO);
            System.out.println("✅ 管理员登录成功，Token: " + adminToken.substring(0, 50) + "...");
            
            // 测试普通用户登录
            System.out.println("2. 测试普通用户登录...");
            UserLoginDTO userLoginDTO = new UserLoginDTO();
            userLoginDTO.setUsername("testuser");
            userLoginDTO.setPassword("user123");
            
            String userToken = userService.login(userLoginDTO);
            System.out.println("✅ 普通用户登录成功，Token: " + userToken.substring(0, 50) + "...");
            
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            throw new RuntimeException(e);
        }
        
        System.out.println("=== 用户登录测试完成 ===");
    }
}