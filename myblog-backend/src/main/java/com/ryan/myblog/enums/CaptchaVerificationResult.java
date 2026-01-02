package com.ryan.myblog.enums;

/**
 * 验证码验证结果枚举
 */
public enum CaptchaVerificationResult {
    /**
     * 验证成功
     */
    SUCCESS("验证成功"),

    /**
     * 验证码错误
     */
    INCORRECT("验证码错误"),

    /**
     * 验证码已过期或不存在
     */
    EXPIRED("验证码已过期，请点击图片刷新");

    private final String message;

    CaptchaVerificationResult(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
