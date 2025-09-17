package com.ryan.myblog.service;

import com.ryan.myblog.config.FileUploadProperties;
import com.ryan.myblog.service.impl.FileUploadServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 文件上传服务测试
 */
class FileUploadServiceTest {
    
    private FileUploadService fileUploadService;
    private FileUploadProperties fileUploadProperties;
    
    @BeforeEach
    void setUp() {
        fileUploadProperties = new FileUploadProperties();
        fileUploadProperties.setPath("./test-uploads");
        fileUploadProperties.setUrlPrefix("/uploads");
        fileUploadProperties.setAllowedImageTypes(new String[]{"image/jpeg", "image/png", "image/gif"});
        fileUploadProperties.setMaxImageSize(5L);
        fileUploadProperties.setMaxFileSize(10L);
        
        fileUploadService = new FileUploadServiceImpl(fileUploadProperties);
    }
    
    @Test
    void testValidateImageType() {
        // 创建测试文件
        MockMultipartFile jpegFile = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "test image content".getBytes()
        );
        
        MockMultipartFile textFile = new MockMultipartFile(
            "file", "test.txt", "text/plain", "test text content".getBytes()
        );
        
        // 测试有效的图片类型
        assertTrue(fileUploadService.isValidFileType(jpegFile, fileUploadProperties.getAllowedImageTypes()));
        
        // 测试无效的文件类型
        assertFalse(fileUploadService.isValidFileType(textFile, fileUploadProperties.getAllowedImageTypes()));
    }
    
    @Test
    void testValidateFileSize() {
        // 创建小文件
        MockMultipartFile smallFile = new MockMultipartFile(
            "file", "small.jpg", "image/jpeg", "small".getBytes()
        );
        
        // 创建大文件 (模拟6MB)
        byte[] largeContent = new byte[6 * 1024 * 1024];
        MockMultipartFile largeFile = new MockMultipartFile(
            "file", "large.jpg", "image/jpeg", largeContent
        );
        
        // 测试小文件
        assertTrue(fileUploadService.isValidFileSize(smallFile, 5L));
        
        // 测试大文件
        assertFalse(fileUploadService.isValidFileSize(largeFile, 5L));
    }
    
    @Test
    void testUploadImageValidation() {
        // 测试无效类型
        MockMultipartFile invalidFile = new MockMultipartFile(
            "file", "test.txt", "text/plain", "content".getBytes()
        );
        
        assertThrows(IllegalArgumentException.class, () -> {
            fileUploadService.uploadImage(invalidFile, "cover");
        });
        
        // 测试空文件
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", "empty.jpg", "image/jpeg", new byte[0]
        );
        
        assertThrows(IllegalArgumentException.class, () -> {
            fileUploadService.uploadFile(emptyFile, "test");
        });
    }
}