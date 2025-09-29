package com.ryan.myblog.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC配置
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {
    
    private final FileUploadProperties fileUploadProperties;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*") // 允许所有来源
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置上传文件的静态资源映射
        String uploadPath = fileUploadProperties.getPath();
        String urlPrefix = fileUploadProperties.getUrlPrefix();
        
        // 确保路径以/结尾
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }
        if (!urlPrefix.endsWith("/")) {
            urlPrefix += "/";
        }
        if (!urlPrefix.startsWith("/")) {
            urlPrefix = "/" + urlPrefix;
        }
        
        registry.addResourceHandler(urlPrefix + "**")
                .addResourceLocations("file:" + uploadPath)
                .setCachePeriod(3600 * 24 * 30); // 缓存30天
    }
}