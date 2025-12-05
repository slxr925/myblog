package com.ryan.myblog.config;

import io.github.cdimascio.dotenv.Dotenv;
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
     * 默认7天（用于向后兼容）
     */
    private Long expiration = 604800L;
    
    /**
     * Access Token过期时间（秒）
     * 默认30分钟
     */
    private Long accessTokenExpiration = 1800L;
    
    /**
     * Refresh Token过期时间（秒）
     * 默认7天
     */
    private Long refreshTokenExpiration = 604800L;

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
        // 尝试从.env文件加载环境变量
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")
                    .ignoreIfMissing()
                    .load();
            
            // 如果secret字段为空，尝试从环境变量或.env文件加载
            if (secret == null || secret.isEmpty()) {
                String envSecret = System.getenv("JWT_SECRET");
                if (envSecret == null || envSecret.isEmpty()) {
                    envSecret = dotenv.get("JWT_SECRET");
                }
                if (envSecret != null && !envSecret.isEmpty()) {
                    this.secret = envSecret;
                }
            }
        } catch (Exception e) {
            log.warn("无法加载.env文件: {}", e.getMessage());
        }
        
        // 调试信息
        log.info("JWT_SECRET from System.getProperty: {}", System.getProperty("JWT_SECRET"));
        log.info("JWT_SECRET from System.getenv: {}", System.getenv("JWT_SECRET"));
        log.info("JWT secret field value: {}", secret);
        
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

        log.info("JWT配置初始化完成 - Access Token过期时间：{}秒，Refresh Token过期时间：{}秒，环境：{}，密钥长度：{}位",
                 accessTokenExpiration, refreshTokenExpiration, activeProfile, secret.length());
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