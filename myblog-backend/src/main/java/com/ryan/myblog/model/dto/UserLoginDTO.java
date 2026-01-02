package com.ryan.myblog.model.dto;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

/**
 * 用户登录DTO
 */
@Data
public class UserLoginDTO {

    @NotBlank(message = "用户名不能为空")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    /**
     * 验证码ID
     */
    private String captchaId;

    /**
     * 用户输入的验证码
     */
    private String captchaCode;
}