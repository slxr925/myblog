package com.ryan.myblog.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 安全响应头过滤器
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        response.setHeader("X-Frame-Options", "SAMEORIGIN");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
        // 简化的CSP，避免影响现有前端
        response.setHeader("Content-Security-Policy", "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;");
        filterChain.doFilter(request, response);
    }
}
