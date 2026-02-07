package com.ryan.myblog.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    
    @Value("${app.security.cors.allowed-origins:*}")
    private String allowedOrigins;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] origins = allowedOrigins != null ? allowedOrigins.split(",") : new String[] { "*" };
        var cors = registry.addMapping("/api/**")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);

        if (origins.length == 1 && "*".equals(origins[0].trim())) {
            cors.allowedOriginPatterns("*");
        } else {
            for (int i = 0; i < origins.length; i++) {
                origins[i] = origins[i].trim();
            }
            cors.allowedOrigins(origins);
        }
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
