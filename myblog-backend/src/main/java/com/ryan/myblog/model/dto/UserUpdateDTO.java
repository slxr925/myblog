package com.ryan.myblog.model.dto;

import lombok.Data;

/**
 * 用户资料更新DTO
 */
@Data
public class UserUpdateDTO {

    private String nickname;

    private String email;

    private String bio;

    private String avatar;

    /**
     * 如果涉及敏感字段变更（如邮箱），需要提供当前密码
     */
    private String currentPassword;
}
