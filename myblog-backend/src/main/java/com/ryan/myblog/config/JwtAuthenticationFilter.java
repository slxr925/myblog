package com.ryan.myblog.config;

import com.ryan.myblog.common.Role;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.service.SessionService;
import com.ryan.myblog.service.UserService;
import com.ryan.myblog.utils.IpUtils;
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
    private final SessionService sessionService;

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

        // 跳过actuator端点（健康检查等）
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/actuator/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = getTokenFromRequest(request);

        if (StringUtils.isNotBlank(token)) {
            try {
                // 验证token
                if (!jwtUtils.validateToken(token)) {
                    log.warn("无效的JWT token");
                    clearSecurityContext();
                    filterChain.doFilter(request, response);
                    return;
                }

                // 获取当前请求的IP地址
                String currentIp = IpUtils.getClientIp(request);

                // 从token中获取用户信息
                Long userId = jwtUtils.getUserIdFromToken(token);
                String username = jwtUtils.getUsernameFromToken(token);
                Integer tokenRole = jwtUtils.getRoleFromToken(token);
                String tokenIp = jwtUtils.getIpFromToken(token);

                // 获取用户详细信息
                User user = getUserService().getUserById(userId);
                if (user != null && user.getStatus() == 0) {

                    // 管理员token需要验证IP
                    if (user.getRole() == Role.ADMIN.getCode() && tokenIp != null) {
                        if (!IpUtils.ipMatches(tokenIp, currentIp)) {
                            log.warn("管理员Token IP验证失败 - 用户: {}, Token IP: {}, 当前IP: {}",
                                    username, tokenIp, currentIp);
                            // IP不匹配，拒绝认证
                            clearSecurityContext();
                            filterChain.doFilter(request, response);
                            return;
                        }
                        log.debug("管理员Token IP验证通过 - 用户: {}, IP: {}", username, currentIp);
                    }

                    // 构建权限列表
                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                    // 根据用户角色添加权限
                    if (user.getRole() == Role.ADMIN.getCode()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    }

                    // 创建认证对象
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            userId, null, authorities);

                    // 设置到Security上下文
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    // 保存或刷新Redis会话
                    sessionService.saveSession(token, userId);
                } else {
                    // 用户不存在或被禁用
                    log.warn("用户不存在或已被禁用 - 用户ID: {}", userId);
                    clearSecurityContext();
                }
            } catch (Exception e) {
                // 如果token解析或用户查询失败，记录日志并清除安全上下文
                log.warn("JWT token处理失败: {}", e.getMessage());
                clearSecurityContext();
            }
        } else {
            // 没有token，确保安全上下文是干净的
            clearSecurityContext();
        }

        filterChain.doFilter(request, response);
    }

    /**
     * 清除Security上下文
     */
    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
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