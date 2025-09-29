package com.ryan.myblog.service;

import com.ryan.myblog.common.Role;
import com.ryan.myblog.dto.UserRegisterDTO;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.utils.UserRoleUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 角色权限测试
 */
@SpringBootTest
public class RolePermissionTest {
    
    @Autowired
    private UserService userService;
    
    @Test
    void testUserRoleUtils() {
        // 模拟管理员用户
        UsernamePasswordAuthenticationToken adminAuth = new UsernamePasswordAuthenticationToken(
            1L, 
            null, 
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(adminAuth);
        
        assertTrue(UserRoleUtils.isAdmin());
        assertFalse(UserRoleUtils.isUser());
        assertTrue(UserRoleUtils.hasRole(Role.ADMIN));
        
        // 模拟普通用户
        UsernamePasswordAuthenticationToken userAuth = new UsernamePasswordAuthenticationToken(
            2L, 
            null, 
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
        SecurityContextHolder.getContext().setAuthentication(userAuth);
        
        assertFalse(UserRoleUtils.isAdmin());
        assertTrue(UserRoleUtils.isUser());
        assertTrue(UserRoleUtils.hasRole(Role.USER));
    }
    
    @Test
    void testUserRegistrationWithRole() {
        UserRegisterDTO userDTO = new UserRegisterDTO();
        userDTO.setUsername("testuser" + System.currentTimeMillis());
        userDTO.setPassword("Test123!@#");
        userDTO.setEmail("test" + System.currentTimeMillis() + "@example.com");
        userDTO.setRole(Role.USER.getCode());
        
        // 这里可以测试用户注册时的角色设置
        // 实际测试需要模拟数据库操作，这里只是验证DTO结构
        assertNotNull(userDTO.getRole());
        assertEquals(Role.USER.getCode(), userDTO.getRole());
    }
    
    @Test
    void testRoleEnum() {
        assertEquals(Role.USER, Role.fromCode(0));
        assertEquals(Role.ADMIN, Role.fromCode(1));
        
        assertEquals("普通用户", Role.USER.getDescription());
        assertEquals("管理员", Role.ADMIN.getDescription());
    }
}