package com.ryan.myblog.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 文件上传配置类
 *
 * 安全特性：
 * 1. 路径安全验证
 * 2. 目录权限检查
 * 3. 文件类型白名单
 * 4. 文件大小限制
 */
@Slf4j
@Data
@Configuration
@ConfigurationProperties(prefix = "app.upload")
public class FileUploadProperties {

    /**
     * 文件上传路径
     */
    private String path = "/app/uploads";

    /**
     * 访问URL前缀
     */
    private String urlPrefix = "/uploads";

    /**
     * 允许的图片文件类型
     */
    private String[] allowedImageTypes = {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"
    };

    /**
     * 允许的文件类型
     */
    private String[] allowedFileTypes = {
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml",
        "application/pdf", "text/plain", "text/markdown"
    };

    /**
     * 单个文件最大大小 (MB)
     */
    private long maxFileSize = 10;

    /**
     * 图片文件最大大小 (MB)
     */
    private long maxImageSize = 5;

    /**
     * 是否启用安全模式
     */
    private boolean secureMode = true;

    @PostConstruct
    public void validate() {
        try {
            // 路径安全验证
            Path uploadPath = Paths.get(path).toAbsolutePath().normalize();

            // 检查路径遍历
            if (path.contains("..") || path.contains("~")) {
                throw new IllegalArgumentException("上传路径不能包含路径遍历字符");
            }

            // 创建目录（如果不存在）- 仅在开发环境或目录可写时创建
            String activeProfile = System.getProperty("spring.profiles.active", "dev");
            boolean isProduction = "prod".equalsIgnoreCase(activeProfile);

            if (!Files.exists(uploadPath)) {
                if (!isProduction) {
                    // 开发环境尝试创建目录
                    try {
                        Files.createDirectories(uploadPath);
                        log.info("创建上传目录: {}", uploadPath);
                    } catch (Exception e) {
                        log.warn("无法创建上传目录: {}，错误: {}，将使用临时目录", uploadPath, e.getMessage());
                        // 使用临时目录
                        uploadPath = Paths.get(System.getProperty("java.io.tmpdir"), "myblog-uploads").normalize();
                        if (!Files.exists(uploadPath)) {
                            Files.createDirectories(uploadPath);
                        }
                        this.path = uploadPath.toString();
                        log.info("使用临时上传目录: {}", uploadPath);
                    }
                } else {
                    // 生产环境要求目录必须存在
                    throw new IllegalStateException("上传目录不存在: " + uploadPath);
                }
            }

            // 检查目录是否可写（仅在目录存在时检查）
            if (Files.exists(uploadPath) && !Files.isWritable(uploadPath)) {
                if (!isProduction) {
                    log.warn("上传目录不可写: {}，将使用临时目录", uploadPath);
                    // 使用临时目录
                    uploadPath = Paths.get(System.getProperty("java.io.tmpdir"), "myblog-uploads").normalize();
                    if (!Files.exists(uploadPath)) {
                        Files.createDirectories(uploadPath);
                    }
                    this.path = uploadPath.toString();
                    log.info("使用临时上传目录: {}", uploadPath);
                } else {
                    throw new IllegalStateException("上传目录不可写: " + uploadPath);
                }
            }

            // 验证URL前缀
            if (!urlPrefix.startsWith("/")) {
                throw new IllegalArgumentException("URL前缀必须以/开头");
            }

            // 安全模式检查
            if (isProduction && !secureMode) {
                log.warn("生产环境建议启用文件上传安全模式");
            }

            log.info("文件上传配置初始化完成 - 路径: {}, URL前缀: {}, 安全模式: {}",
                     uploadPath, urlPrefix, secureMode);

        } catch (Exception e) {
            throw new IllegalStateException("文件上传配置验证失败: " + e.getMessage(), e);
        }
    }

    /**
     * 获取安全的上传路径
     */
    public String getSecurePath() {
        return Paths.get(path).toAbsolutePath().normalize().toString();
    }

    /**
     * 检查文件类型是否允许
     */
    public boolean isAllowedFileType(String contentType, boolean isImage) {
        String[] allowedTypes = isImage ? allowedImageTypes : allowedFileTypes;
        return java.util.Arrays.asList(allowedTypes).contains(contentType);
    }
}