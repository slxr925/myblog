package com.ryan.myblog.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ryan.myblog.common.Result;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

/**
 * Spring Security配置
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF
            .csrf(AbstractHttpConfigurer::disable)
            // 启用CORS
            .cors(cors -> cors.configure(http))
            // 设置会话管理为无状态
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 配置异常处理
            .exceptionHandling(exception -> exception
                // 未认证处理（401）
                .authenticationEntryPoint((request, response, authException) -> {
                    writeJsonResponse(response, HttpStatus.UNAUTHORIZED.value(), "未授权，请先登录");
                })
                // 无权限处理（403）
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    writeJsonResponse(response, HttpStatus.FORBIDDEN.value(), "权限不足，无法访问");
                })
            )
            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                // 允许所有OPTIONS请求（CORS预检）
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 允许健康检查和监控端点（用于Docker健康检查）
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                // 允许访问主页和静态资源
                .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
                // 允许访问静态资源
                .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**").permitAll()
                // 允许用户注册和登录
                .requestMatchers("/api/user/register", "/api/user/login", "/api/user/logout").permitAll()
                // 允许查看博客列表和详情
                .requestMatchers("/api/blog/page", "/api/blog/{id}").permitAll()
                // 允许搜索功能
                .requestMatchers("/api/search/**").permitAll()
                // 允许查看分类和标签
                .requestMatchers("/api/category/list", "/api/tag/list", "/api/tag/used").permitAll()
                // 允许搜索博客和根据标签搜索
                .requestMatchers("/api/blog/search", "/api/blog/search/by-tag").permitAll()
                // 允许获取最新博客和热门博客
                .requestMatchers("/api/blog/latest", "/api/blog/hot").permitAll()
                // 允许根据分类获取博客
                .requestMatchers("/api/blog/category/*").permitAll()
                // 允许健康检查和欢迎页面
                .requestMatchers("/api/health", "/api/welcome").permitAll()
                // 允许访问Swagger和Knife4j文档
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**").permitAll()
                .requestMatchers("/doc.html", "/webjars/**", "/swagger-resources/**", "/v3/api-docs/**").permitAll()
                // 允许访问缓存测试接口（仅用于开发测试）
                .requestMatchers("/api/cache/**").permitAll()
                // 记录页面访问日志（允许匿名访问）
                .requestMatchers("/api/admin/track-visit").permitAll()
                // 允许访问AI助手接口
                .requestMatchers("/api/ai/**").permitAll()
                // 管理员专用接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // 博客管理接口需要管理员权限
                .requestMatchers("/api/blog/save", "/api/blog/update", "/api/blog/delete/**").hasRole("ADMIN")
                // 分类管理接口需要管理员权限
                .requestMatchers("/api/category/save", "/api/category/update", "/api/category/delete/**").hasRole("ADMIN")
                // 标签管理接口需要管理员权限
                .requestMatchers("/api/tag/save", "/api/tag/update", "/api/tag/delete/**").hasRole("ADMIN")
                // 文件上传需要登录（管理员和普通用户都可以）
                .requestMatchers("/api/file/upload").hasRole("ADMIN")
                // 查看评论不需要登录，但发表评论和点赞需要登录
                .requestMatchers(HttpMethod.GET, "/api/comment/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/comment/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/comment/**").authenticated()
                .requestMatchers("/api/like/**").authenticated()
                // 用户信息接口需要认证（包括GET和PUT）
                .requestMatchers("/api/user/info").authenticated()
                // 修改密码接口需要认证
                .requestMatchers("/api/user/change-password").authenticated()
                // 其他请求需要认证
                .anyRequest().authenticated()
            )
            // 添加JWT过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    /**
     * 写入JSON响应
     */
    private void writeJsonResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        
        Result<Void> result = Result.error(status, message);
        ObjectMapper objectMapper = new ObjectMapper();
        response.getWriter().write(objectMapper.writeValueAsString(result));
    }
}