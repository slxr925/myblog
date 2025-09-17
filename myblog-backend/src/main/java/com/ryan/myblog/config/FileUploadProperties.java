package com.ryan.myblog.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

/**
 * 文件上传配置类
 */
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
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    };
    
    /**
     * 单个文件最大大小 (MB)
     */
    private long maxFileSize = 10;
    
    /**
     * 图片文件最大大小 (MB)
     */
    private long maxImageSize = 5;
}