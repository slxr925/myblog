package com.ryan.myblog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改密码数据传输对象
 */
@Data
public class ChangePasswordDTO {
    
    /**
     * 当前密码
     */
    @NotBlank(message = "当前密码不能为空")
    private String currentPassword;
    
    /**
     * 新密码
     */
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, message = "新密码长度不能少于6位")
    private String newPassword;
    
    /**
     * 确认新密码
     */
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;
}