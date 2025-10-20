package com.ryan.myblog.model.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

/**
 * 文件上传DTO
 */
@Data
public class FileUploadDTO {

    /**
     * 上传的文件
     */
    private MultipartFile file;

    /**
     * 文件类型分类：avatar-头像，cover-封面图片，attachment-附件
     */
    private String type;

    /**
     * 文件描述
     */
    private String description;
}