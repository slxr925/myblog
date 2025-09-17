package com.ryan.myblog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootTest
public class GeneratePasswordHashTest {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    public void generatePasswordHashes() {
        System.out.println("=== 生成密码哈希 ===");
        
        String[] passwords = {"admin123", "user123", "password123"};
        
        for (String password : passwords) {
            String hash = passwordEncoder.encode(password);
            System.out.println("密码: " + password + " -> 哈希: " + hash);
            
            // 验证哈希是否正确
            boolean matches = passwordEncoder.matches(password, hash);
            System.out.println("验证: " + matches);
            System.out.println();
        }
    }
}