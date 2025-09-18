package com.ryan.myblog.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * JWT配置属性
 *
 * 安全建议：
 * 1. 生产环境使用环境变量设置密钥
 * 2. 密钥长度至少256位
 * 3. 定期更换密钥
 * 4. 不同环境使用不同密钥
 */
@Data
@Slf4j
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    /**
     * JWT密钥
     * 生产环境必须通过JWT_SECRET环境变量设置
     */
    private String secret;

    /**
     * JWT过期时间（秒）
     * 默认7天
     */
    private Long expiration = 604800L;

    /**
     * 最小密钥长度
     */
    private static final int MIN_SECRET_LENGTH = 32;

    /**
     * 默认开发环境密钥（仅用于开发）
     */
    private static final String DEFAULT_DEV_SECRET = "myBlogSecretKeyForJWTTokenGeneration2024!@#$%";

    @PostConstruct
    public void validate() {
        // 生产环境安全检查
        String activeProfile = System.getProperty("spring.profiles.active", "dev");
        boolean isProduction = "prod".equalsIgnoreCase(activeProfile);

        // 检查是否使用了默认密钥
        if (DEFAULT_DEV_SECRET.equals(secret) && isProduction) {
            throw new IllegalArgumentException(
                "生产环境不能使用默认JWT密钥！请通过JWT_SECRET环境变量设置安全的密钥"
            );
        }

        // 检查密钥长度
        if (secret == null || secret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalArgumentException(
                "JWT密钥长度必须至少为" + MIN_SECRET_LENGTH + "位，当前长度为" +
                (secret != null ? secret.length() : 0)
            );
        }

        // 检查密钥复杂度（生产环境）
        if (isProduction && !isStrongSecret(secret)) {
            log.warn("JWT密钥复杂度建议：包含大小写字母、数字和特殊字符");
        }

        log.info("JWT配置初始化完成 - 过期时间：{}秒，环境：{}，密钥长度：{}位",
                 expiration, activeProfile, secret.length());
    }

    /**
     * 检查密钥强度
     */
    private boolean isStrongSecret(String secret) {
        boolean hasUpper = secret.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = secret.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = secret.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = secret.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));

        return hasUpper && hasLower && hasDigit && hasSpecial;
    }
}