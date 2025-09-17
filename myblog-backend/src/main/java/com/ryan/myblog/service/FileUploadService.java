package com.ryan.myblog.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传服务接口
 */
public interface FileUploadService {
    
    /**
     * 上传图片文件
     * 
     * @param file 文件
     * @param type 文件类型 (cover: 封面图, content: 内容图片)
     * @return 文件访问URL
     */
    String uploadImage(MultipartFile file, String type);
    
    /**
     * 上传通用文件
     * 
     * @param file 文件
     * @param type 文件类型
     * @return 文件访问URL
     */
    String uploadFile(MultipartFile file, String type);
    
    /**
     * 删除文件
     * 
     * @param filePath 文件路径
     * @return 是否删除成功
     */
    boolean deleteFile(String filePath);
    
    /**
     * 验证文件类型
     * 
     * @param file 文件
     * @param allowedTypes 允许的类型
     * @return 是否有效
     */
    boolean isValidFileType(MultipartFile file, String[] allowedTypes);
    
    /**
     * 验证文件大小
     * 
     * @param file 文件
     * @param maxSizeMB 最大大小(MB)
     * @return 是否有效
     */
    boolean isValidFileSize(MultipartFile file, long maxSizeMB);
}