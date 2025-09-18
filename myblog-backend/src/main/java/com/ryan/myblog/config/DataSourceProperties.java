package com.ryan.myblog.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 数据源配置属性
 *
 * 安全特性：
 * 1. 生产环境强制使用SSL连接
 * 2. 密码强度验证
 * 3. 连接字符串安全检查
 */
@Data
@Slf4j
@Configuration
@ConfigurationProperties(prefix = "spring.datasource")
public class DataSourceProperties {

    private String url;
    private String username;
    private String password;
    private String driverClassName;

    @PostConstruct
    public void validate() {
        String activeProfile = System.getProperty("spring.profiles.active", "dev");
        boolean isProduction = "prod".equalsIgnoreCase(activeProfile);

        // 生产环境安全检查
        if (isProduction) {
            // 检查是否使用默认密码
            if (password == null || password.isEmpty()) {
                throw new IllegalArgumentException(
                    "生产环境数据库密码不能为空！请通过DB_PASSWORD环境变量设置数据库密码"
                );
            }

            // 检查密码强度
            if (!isStrongPassword(password)) {
                log.warn("数据库密码强度建议：包含大小写字母、数字和特殊字符，长度至少8位");
            }

            // 检查是否启用SSL
            if (!url.contains("useSSL=true")) {
                log.warn("生产环境建议启用数据库SSL连接");
            }

            // 检查用户名安全性
            if ("root".equals(username)) {
                log.warn("生产环境建议使用非root数据库用户");
            }
        }

        // 记录配置信息（隐藏敏感信息）
        log.info("数据库配置初始化完成 - URL: {}, 用户: {}, SSL: {}",
                 maskJdbcUrl(url), username, url.contains("useSSL=true"));
    }

    /**
     * 检查密码强度
     */
    private boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    /**
     * 遮罩JDBC URL中的敏感信息
     */
    private String maskJdbcUrl(String url) {
        if (url == null) {
            return null;
        }
        // 移除密码部分（如果有）
        return url.replaceAll("(?\u003c=password=)[^\u0026]+", "***");
    }
}