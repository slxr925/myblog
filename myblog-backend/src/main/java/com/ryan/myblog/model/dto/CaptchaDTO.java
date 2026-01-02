package com.ryan.myblog.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 验证码响应DTO
 */
@Data
@AllArgsConstructor
public class CaptchaDTO {
    /**
     * 验证码唯一ID
     */
    private String captchaId;

    /**
     * Base64编码的验证码图片
     */
    private String imageBase64;
}
