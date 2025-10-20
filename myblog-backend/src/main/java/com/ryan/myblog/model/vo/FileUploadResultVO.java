package com.ryan.myblog.model.vo;

import lombok.Data;

/**
 * 文件上传结果VO
 */
@Data
public class FileUploadResultVO {

    /**
     * 文件访问URL
     */
    private String url;

    /**
     * 文件名
     */
    private String filename;

    /**
     * 文件大小（字节）
     */
    private Long size;

    /**
     * 文件类型
     */
    private String contentType;

    /**
     * 上传时间
     */
    private String uploadTime;

    public FileUploadResultVO(String url, String filename, Long size, String contentType) {
        this.url = url;
        this.filename = filename;
        this.size = size;
        this.contentType = contentType;
        this.uploadTime = java.time.LocalDateTime.now().toString();
    }
}