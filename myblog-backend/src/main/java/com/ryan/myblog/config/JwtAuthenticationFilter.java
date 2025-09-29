package com.ryan.myblog.config;

import com.ryan.myblog.common.Role;
import com.ryan.myblog.entity.User;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * JWT认证过滤器
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtUtils jwtUtils;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    private UserService userService;
    
    private UserService getUserService() {
        if (userService == null) {
            userService = applicationContext.getBean(UserService.class);
        }
        return userService;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String token = getTokenFromRequest(request);
        
        if (StringUtils.isNotBlank(token) && jwtUtils.validateToken(token)) {
            try {
                // 从token中获取用户信息
                Long userId = jwtUtils.getUserIdFromToken(token);
                String username = jwtUtils.getUsernameFromToken(token);
                
                // 获取用户详细信息
                User user = getUserService().getUserById(userId);
                if (user != null && user.getStatus() == 0) {
                    // 构建权限列表
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    
                    // 根据用户角色添加权限
                    if (user.getRole() == Role.ADMIN.getCode()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    }
                    
                    // 创建认证对象
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                            userId, null, authorities);
                    
                    // 设置到Security上下文
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // 如果token解析或用户查询失败，记录日志但不抛出异常
                // 让请求继续，由后续的权限检查来处理
                log.warn("JWT token处理失败: {}", e.getMessage());
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * 从请求头中获取token
     */
    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.isNotBlank(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}