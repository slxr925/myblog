package com.ryan.myblog.test;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * 密码测试工具
 */
public class PasswordTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String plainPassword = "user123";
        String hashedPassword = "$2a$10$YrB.2F6MZQx8qVqOFJ5BfeBd7rZ6d5xJ9dJ4hJw9gJd8A5zXd9Q2W";
        
        System.out.println("明文密码: " + plainPassword);
        System.out.println("哈希密码: " + hashedPassword);
        
        boolean matches = encoder.matches(plainPassword, hashedPassword);
        System.out.println("密码匹配: " + matches);
        
        // 生成新的哈希
        String newHash = encoder.encode(plainPassword);
        System.out.println("新生成的哈希: " + newHash);
        System.out.println("新哈希匹配: " + encoder.matches(plainPassword, newHash));
    }
}