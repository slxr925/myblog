package com.ryan.myblog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class PasswordEncoderTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void testPasswordEncoding() {
        String plainPassword = "user123";
        String hashedPassword = "$2a$10$YrB.2F6MZQx8qVqOFJ5BfeBd7rZ6d5xJ9dJ4hJw9gJd8A5zXd9Q2W";
        
        System.out.println("明文密码: " + plainPassword);
        System.out.println("数据库哈希密码: " + hashedPassword);
        
        boolean matches = passwordEncoder.matches(plainPassword, hashedPassword);
        System.out.println("密码匹配结果: " + matches);
        
        // 测试编码新密码
        String newHash = passwordEncoder.encode(plainPassword);
        System.out.println("新生成的哈希: " + newHash);
        System.out.println("新哈希是否匹配: " + passwordEncoder.matches(plainPassword, newHash));
        
        // 测试admin密码
        String adminPassword = "admin123";
        String adminHash = "$2a$10$XbRzYoZDdqrKJjVR7P6qCOdR5WZyTbZsJ3IxzYzG8mCJZJyQCpLd6";
        System.out.println("\nAdmin密码测试:");
        System.out.println("Admin明文密码: " + adminPassword);
        System.out.println("Admin哈希密码: " + adminHash);
        System.out.println("Admin密码匹配: " + passwordEncoder.matches(adminPassword, adminHash));
    }
}