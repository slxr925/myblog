package com.ryan.myblog.dto;

import com.ryan.myblog.utils.PasswordValidator;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.lang.annotation.*;

/**
 * 用户注册DTO
 */
@Data
public class UserRegisterDTO {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度必须在3-20位之间")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 20, message = "密码长度必须在8-20位之间")
    @StrongPassword(message = "密码必须包含大小写字母、数字和特殊字符，且不能包含用户名或邮箱")
    private String password;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @Size(max = 50, message = "昵称长度不能超过50位")
    private String nickname;

    /**
     * 用户角色：0-普通用户，1-管理员
     * 默认注册为普通用户
     */
    @NotNull(message = "角色不能为空")
    private Integer role = 0;

    /**
     * 密码强度验证注解
     */
    @Target({ElementType.FIELD})
    @Retention(RetentionPolicy.RUNTIME)
    @Constraint(validatedBy = StrongPasswordValidator.class)
    public @interface StrongPassword {
        String message() default "密码强度不符合要求";
        Class<?>[] groups() default {};
        Class<? extends Payload>[] payload() default {};
    }

    /**
     * 密码强度验证器
     */
    public static class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

        @Override
        public void initialize(StrongPassword constraintAnnotation) {
        }

        @Override
        public boolean isValid(String password, ConstraintValidatorContext context) {
            if (password == null) {
                return false;
            }

            // 基本强度验证
            PasswordValidator.PasswordValidationResult result = PasswordValidator.validateBasic(password);
            if (!result.isValid()) {
                // 自定义错误消息
                context.disableDefaultConstraintViolation();
                context.buildConstraintViolationWithTemplate(result.getMessage())
                        .addConstraintViolation();
                return false;
            }

            return true;
        }
    }
}