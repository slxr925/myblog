package com.ryan.myblog.service.impl;

import com.ryan.myblog.config.FileUploadProperties;
import com.ryan.myblog.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.UUID;

/**
 * 文件上传服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {
    
    private final FileUploadProperties fileUploadProperties;
    
    @Override
    public String uploadImage(MultipartFile file, String type) {
        // 验证文件
        if (!isValidFileType(file, fileUploadProperties.getAllowedImageTypes())) {
            throw new IllegalArgumentException("不支持的图片格式");
        }
        
        if (!isValidFileSize(file, fileUploadProperties.getMaxImageSize())) {
            throw new IllegalArgumentException("图片文件大小超过限制：" + fileUploadProperties.getMaxImageSize() + "MB");
        }
        
        return uploadFile(file, type != null ? type : "image");
    }
    
    @Override
    public String uploadFile(MultipartFile file, String type) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }
        
        try {
            // 创建上传目录
            String uploadPath = createUploadPath(type);
            
            // 生成唯一文件名
            String fileName = generateFileName(file.getOriginalFilename());
            
            // 完整文件路径
            Path filePath = Paths.get(uploadPath, fileName);
            
            // 确保目录存在
            Files.createDirectories(filePath.getParent());
            
            // 保存文件
            file.transferTo(filePath);
            
            // 返回访问URL
            String relativeUrl = generateAccessUrl(type, fileName);
            
            log.info("文件上传成功: {} -> {}", file.getOriginalFilename(), relativeUrl);
            
            return relativeUrl;
            
        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败", e);
        }
    }
    
    @Override
    public boolean deleteFile(String filePath) {
        try {
            // 从URL路径转换为实际文件路径
            String actualPath = convertUrlToFilePath(filePath);
            Path path = Paths.get(actualPath);
            
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("文件删除成功: {}", filePath);
                return true;
            } else {
                log.warn("文件不存在: {}", filePath);
                return false;
            }
        } catch (IOException e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean isValidFileType(MultipartFile file, String[] allowedTypes) {
        String contentType = file.getContentType();
        return contentType != null && Arrays.asList(allowedTypes).contains(contentType);
    }
    
    @Override
    public boolean isValidFileSize(MultipartFile file, long maxSizeMB) {
        long maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.getSize() <= maxSizeBytes;
    }
    
    /**
     * 创建上传路径
     */
    private String createUploadPath(String type) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        return Paths.get(fileUploadProperties.getPath(), type, datePath).toString();
    }
    
    /**
     * 生成唯一文件名
     */
    private String generateFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String timestamp = String.valueOf(System.currentTimeMillis());
        return uuid + "_" + timestamp + extension;
    }
    
    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
    
    /**
     * 生成访问URL
     */
    private String generateAccessUrl(String type, String fileName) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        return fileUploadProperties.getUrlPrefix() + "/" + type + "/" + datePath + "/" + fileName;
    }
    
    /**
     * 将URL路径转换为文件系统路径
     */
    private String convertUrlToFilePath(String urlPath) {
        if (urlPath.startsWith(fileUploadProperties.getUrlPrefix())) {
            String relativePath = urlPath.substring(fileUploadProperties.getUrlPrefix().length());
            return fileUploadProperties.getPath() + relativePath;
        }
        return urlPath;
    }
}