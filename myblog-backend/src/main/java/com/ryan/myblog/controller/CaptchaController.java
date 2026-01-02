package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.dto.CaptchaDTO;
import com.ryan.myblog.service.CaptchaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 验证码控制器
 */
@RestController
@RequestMapping("/api/captcha")
@RequiredArgsConstructor
@Slf4j
public class CaptchaController {

    private final CaptchaService captchaService;

    /**
     * 生成验证码
     * 
     * @return 验证码DTO（包含ID和Base64图片）
     */
    @GetMapping("/generate")
    public Result<CaptchaDTO> generateCaptcha() {
        CaptchaDTO captcha = captchaService.generateCaptcha();
        return Result.success(captcha);
    }
}
