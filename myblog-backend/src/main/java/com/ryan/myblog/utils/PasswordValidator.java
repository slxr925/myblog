package com.ryan.myblog.utils;

import lombok.extern.slf4j.Slf4j;
import java.util.regex.Pattern;

/**
 * 密码验证工具类
 *
 * 密码强度要求：
 * 1. 长度至少8位，最多20位
 * 2. 必须包含大小写字母
 * 3. 必须包含数字
 * 4. 必须包含特殊字符
 * 5. 不能包含用户名或邮箱
 * 6. 不能是常见弱密码
 */
@Slf4j
public class PasswordValidator {

    // 密码最小长度
    private static final int MIN_LENGTH = 8;

    // 密码最大长度
    private static final int MAX_LENGTH = 20;

    // 必须包含小写字母
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");

    // 必须包含大写字母
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");

    // 必须包含数字
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");

    // 必须包含特殊字符
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");

    // 常见弱密码列表
    private static final String[] COMMON_WEAK_PASSWORDS = {
        "password", "123456", "12345678", "qwerty", "abc123",
        "password123", "admin123", "root123", "letmein", "welcome",
        "monkey", "1234567890", "abcdef", "abcdefg", "qwertyuiop",
        "111111", "222222", "333333", "444444", "555555",
        "666666", "777777", "888888", "999999", "000000"
    };

    /**
     * 验证密码强度
     * @param password 密码
     * @param username 用户名（用于排除包含用户名的情况）
     * @param email 邮箱（用于排除包含邮箱的情况）
     * @return 验证结果
     */
    public static PasswordValidationResult validate(String password, String username, String email) {
        if (password == null || password.isEmpty()) {
            return new PasswordValidationResult(false, "密码不能为空");
        }

        // 长度检查
        if (password.length() < MIN_LENGTH) {
            return new PasswordValidationResult(false, String.format("密码长度至少为%d位", MIN_LENGTH));
        }

        if (password.length() > MAX_LENGTH) {
            return new PasswordValidationResult(false, String.format("密码长度不能超过%d位", MAX_LENGTH));
        }

        // 检查小写字母
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            return new PasswordValidationResult(false, "密码必须包含至少一个小写字母");
        }

        // 检查大写字母
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            return new PasswordValidationResult(false, "密码必须包含至少一个大写字母");
        }

        // 检查数字
        if (!DIGIT_PATTERN.matcher(password).find()) {
            return new PasswordValidationResult(false, "密码必须包含至少一个数字");
        }

        // 检查特殊字符
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            return new PasswordValidationResult(false, "密码必须包含至少一个特殊字符（如!@#$%^&*等）");
        }

        // 检查是否包含用户名
        if (username != null && !username.isEmpty() && password.toLowerCase().contains(username.toLowerCase())) {
            return new PasswordValidationResult(false, "密码不能包含用户名");
        }

        // 检查是否包含邮箱
        if (email != null && !email.isEmpty()) {
            String emailPrefix = email.split("@")[0];
            if (password.toLowerCase().contains(emailPrefix.toLowerCase())) {
                return new PasswordValidationResult(false, "密码不能包含邮箱前缀");
            }
        }

        // 检查是否为常见弱密码
        String lowerPassword = password.toLowerCase();
        for (String weakPassword : COMMON_WEAK_PASSWORDS) {
            if (lowerPassword.equals(weakPassword) || lowerPassword.contains(weakPassword)) {
                return new PasswordValidationResult(false, "密码太简单，请使用更复杂的密码");
            }
        }

        // 检查连续重复字符（如111111, aaaaaa）
        if (hasConsecutiveRepeatingChars(password)) {
            return new PasswordValidationResult(false, "密码不能包含连续重复的字符");
        }

        // 检查键盘顺序（如qwerty, 123456）
        if (hasKeyboardSequence(password)) {
            return new PasswordValidationResult(false, "密码不能包含键盘顺序字符");
        }

        // 计算密码强度分数
        int score = calculatePasswordStrength(password);
        String strengthLevel = getStrengthLevel(score);

        log.info("密码强度验证通过，评分: {}，等级: {}", score, strengthLevel);
        return new PasswordValidationResult(true, String.format("密码强度：%s", strengthLevel));
    }

    /**
     * 验证密码强度（简化版本，只检查基本要求）
     * @param password 密码
     * @return 验证结果
     */
    public static PasswordValidationResult validateBasic(String password) {
        if (password == null || password.isEmpty()) {
            return new PasswordValidationResult(false, "密码不能为空");
        }

        if (password.length() < MIN_LENGTH) {
            return new PasswordValidationResult(false, String.format("密码长度至少为%d位", MIN_LENGTH));
        }

        if (password.length() > MAX_LENGTH) {
            return new PasswordValidationResult(false, String.format("密码长度不能超过%d位", MAX_LENGTH));
        }

        // 至少包含两种字符类型（大小写字母、数字、特殊字符）
        int charTypeCount = 0;
        if (LOWERCASE_PATTERN.matcher(password).find()) charTypeCount++;
        if (UPPERCASE_PATTERN.matcher(password).find()) charTypeCount++;
        if (DIGIT_PATTERN.matcher(password).find()) charTypeCount++;
        if (SPECIAL_CHAR_PATTERN.matcher(password).find()) charTypeCount++;

        if (charTypeCount < 2) {
            return new PasswordValidationResult(false, "密码必须包含至少两种字符类型（大小写字母、数字、特殊字符）");
        }

        return new PasswordValidationResult(true, "密码强度符合要求");
    }

    /**
     * 检查是否有连续重复字符
     */
    private static boolean hasConsecutiveRepeatingChars(String password) {
        int count = 1;
        char prev = password.charAt(0);

        for (int i = 1; i < password.length(); i++) {
            if (password.charAt(i) == prev) {
                count++;
                if (count >= 3) {
                    return true;
                }
            } else {
                count = 1;
                prev = password.charAt(i);
            }
        }
        return false;
    }

    /**
     * 检查是否包含键盘顺序
     */
    private static boolean hasKeyboardSequence(String password) {
        String lowerPassword = password.toLowerCase();

        // 常见键盘顺序
        String[] sequences = {
            "qwerty", "asdfgh", "zxcvbn", "123456", "234567", "345678", "456789", "567890",
            "qazwsx", "1qaz2wsx", "qweasd", "qazxsw"
        };

        for (String sequence : sequences) {
            if (lowerPassword.contains(sequence)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 计算密码强度分数
     */
    private static int calculatePasswordStrength(String password) {
        int score = 0;

        // 长度分数
        if (password.length() >= 12) score += 2;
        else if (password.length() >= 10) score += 1;

        // 字符类型分数
        if (LOWERCASE_PATTERN.matcher(password).find()) score++;
        if (UPPERCASE_PATTERN.matcher(password).find()) score++;
        if (DIGIT_PATTERN.matcher(password).find()) score++;
        if (SPECIAL_CHAR_PATTERN.matcher(password).find()) score++;

        // 复杂度加分
        if (password.length() >= 12 && score >= 4) score++;
        if (password.length() >= 16) score++;

        return score;
    }

    /**
     * 获取强度等级
     */
    private static String getStrengthLevel(int score) {
        if (score >= 6) return "非常强";
        if (score >= 5) return "强";
        if (score >= 4) return "中等";
        if (score >= 3) return "弱";
        return "非常弱";
    }

    /**
     * 密码验证结果类
     */
    public static class PasswordValidationResult {
        private final boolean valid;
        private final String message;

        public PasswordValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() {
            return valid;
        }

        public String getMessage() {
            return message;
        }
    }
}