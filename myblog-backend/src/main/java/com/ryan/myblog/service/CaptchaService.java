package com.ryan.myblog.service;

import com.ryan.myblog.enums.CaptchaVerificationResult;
import com.ryan.myblog.model.dto.CaptchaDTO;

/**
 * 验证码服务接口
 */
public interface CaptchaService {
    /**
     * 生成验证码
     * 
     * @return 验证码DTO，包含ID和Base64图片
     */
    CaptchaDTO generateCaptcha();

    /**
     * 验证验证码
     * 
     * @param captchaId 验证码ID
     * @param userCode  用户输入的验证码
     * @return 验证结果（成功/错误/过期）
     */
    CaptchaVerificationResult verifyCaptcha(String captchaId, String userCode);
}
