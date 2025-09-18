package com.ryan.myblog.utils;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * 路径安全工具类
 *
 * 提供路径遍历攻击防护功能
 */
@Slf4j
public class PathSecurityUtils {

    // 禁止的路径字符
    private static final Set<String> FORBIDDEN_PATH_SEQUENCES = new HashSet<>(Arrays.asList(
            "..", "~", "//", "\\x00", "\u003c", "\u003e", ":", "\"", "|", "?", "*"
    ));

    // 危险文件扩展名
    private static final Set<String> DANGEROUS_EXTENSIONS = new HashSet<>(Arrays.asList(
            ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar",
            ".php", ".asp", ".aspx", ".jsp", ".sh", ".bash", ".csh", ".ksh",
            ".pl", ".py", ".rb", ".go", ".dll", ".so", ".dylib"
    ));

    /**
     * 验证路径是否安全（防止路径遍历攻击）
     * @param path 待验证的路径
     * @param basePath 基础路径，用于确保路径在允许范围内
     * @return 验证结果
     */
    public static PathValidationResult validatePath(String path, String basePath) {
        if (path == null || path.trim().isEmpty()) {
            return new PathValidationResult(false, "路径不能为空");
        }

        // 检查是否包含危险字符
        String normalizedPath = path.replace("\\", "/");
        for (String forbidden : FORBIDDEN_PATH_SEQUENCES) {
            if (normalizedPath.contains(forbidden)) {
                log.warn("路径包含危险字符：{}，路径：{}", forbidden, path);
                return new PathValidationResult(false, "路径包含非法字符：" + forbidden);
            }
        }

        try {
            // 标准化路径
            Path targetPath = Paths.get(path).normalize();

            // 如果提供了基础路径，确保目标路径在基础路径内
            if (basePath != null && !basePath.trim().isEmpty()) {
                Path basePathObj = Paths.get(basePath).normalize();

                // 确保目标路径在基础路径内
                if (!targetPath.startsWith(basePathObj)) {
                    log.warn("路径越界访问：{}，基础路径：{}", path, basePath);
                    return new PathValidationResult(false, "路径访问被拒绝");
                }
            }

            // 检查路径深度（防止过深的路径）
            int depth = targetPath.getNameCount();
            if (depth > 10) {
                log.warn("路径深度过大：{}，深度：{}", path, depth);
                return new PathValidationResult(false, "路径深度超出限制");
            }

            return new PathValidationResult(true, "路径验证通过");

        } catch (Exception e) {
            log.error("路径验证异常：{}，错误：{}", path, e.getMessage());
            return new PathValidationResult(false, "路径格式错误");
        }
    }

    /**
     * 验证文件名是否安全
     * @param filename 文件名
     * @return 验证结果
     */
    public static PathValidationResult validateFileName(String filename) {
        if (filename == null || filename.trim().isEmpty()) {
            return new PathValidationResult(false, "文件名不能为空");
        }

        // 移除前后空格
        filename = filename.trim();

        // 检查文件名长度
        if (filename.length() > 255) {
            return new PathValidationResult(false, "文件名长度不能超过255个字符");
        }

        // 检查是否包含路径分隔符
        if (filename.contains("/") || filename.contains("\\")) {
            return new PathValidationResult(false, "文件名不能包含路径分隔符");
        }

        // 检查是否包含控制字符
        for (char c : filename.toCharArray()) {
            if (c < 32 || c == 127) {
                return new PathValidationResult(false, "文件名包含非法字符");
            }
        }

        // 检查危险字符
        String[] dangerousChars = {"\u003c", "\u003e", ":", "\"", "|", "?", "*", "..", "~"};
        for (String dangerous : dangerousChars) {
            if (filename.contains(dangerous)) {
                return new PathValidationResult(false, "文件名包含非法字符：" + dangerous);
            }
        }

        // 检查文件扩展名
        String extension = getFileExtension(filename);
        if (DANGEROUS_EXTENSIONS.contains(extension.toLowerCase())) {
            log.warn("尝试上传危险文件类型：{}，文件名：{}", extension, filename);
            return new PathValidationResult(false, "不允许上传此类型的文件：" + extension);
        }

        return new PathValidationResult(true, "文件名验证通过");
    }

    /**
     * 验证文件扩展名是否安全
     * @param extension 文件扩展名
     * @param allowedExtensions 允许的扩展名列表
     * @return 验证结果
     */
    public static PathValidationResult validateFileExtension(String extension, Set<String> allowedExtensions) {
        if (extension == null || extension.trim().isEmpty()) {
            return new PathValidationResult(false, "文件扩展名不能为空");
        }

        // 标准化扩展名
        extension = extension.trim().toLowerCase();
        if (!extension.startsWith(".")) {
            extension = "." + extension;
        }

        // 检查扩展名格式
        if (!extension.matches("^\\.[a-zA-Z0-9]+$")) {
            return new PathValidationResult(false, "文件扩展名格式错误");
        }

        // 检查是否在允许列表中
        if (allowedExtensions != null && !allowedExtensions.isEmpty()) {
            boolean allowed = false;
            for (String allowedExt : allowedExtensions) {
                if (extension.equalsIgnoreCase(allowedExt.trim())) {
                    allowed = true;
                    break;
                }
            }
            if (!allowed) {
                return new PathValidationResult(false, "不允许的文件扩展名：" + extension);
            }
        }

        return new PathValidationResult(true, "文件扩展名验证通过");
    }

    /**
     * 获取文件扩展名
     */
    private static String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }
        return "";
    }

    /**
     * 创建安全的文件路径
     * @param basePath 基础路径
     * @param subPath 子路径
     * @param filename 文件名
     * @return 安全的路径
     */
    public static String createSafeFilePath(String basePath, String subPath, String filename) {
        // 验证基础路径
        PathValidationResult baseResult = validatePath(basePath, null);
        if (!baseResult.isValid()) {
            throw new SecurityException("基础路径不安全：" + baseResult.getMessage());
        }

        // 验证子路径
        if (subPath != null && !subPath.trim().isEmpty()) {
            PathValidationResult subResult = validatePath(subPath, basePath);
            if (!subResult.isValid()) {
                throw new SecurityException("子路径不安全：" + subResult.getMessage());
            }
        }

        // 验证文件名
        PathValidationResult fileResult = validateFileName(filename);
        if (!fileResult.isValid()) {
            throw new SecurityException("文件名不安全：" + fileResult.getMessage());
        }

        try {
            // 构建完整路径
            Path basePathObj = Paths.get(basePath).normalize();
            Path fullPath;

            if (subPath != null && !subPath.trim().isEmpty()) {
                Path subPathObj = Paths.get(subPath).normalize();
                fullPath = basePathObj.resolve(subPathObj).resolve(filename);
            } else {
                fullPath = basePathObj.resolve(filename);
            }

            // 确保最终路径仍在基础路径内
            if (!fullPath.normalize().startsWith(basePathObj)) {
                throw new SecurityException("路径构建结果超出基础路径范围");
            }

            return fullPath.toString();

        } catch (Exception e) {
            throw new SecurityException("构建安全路径失败：" + e.getMessage());
        }
    }

    /**
     * 清理路径中的危险字符
     * @param path 路径
     * @return 清理后的路径
     */
    public static String sanitizePath(String path) {
        if (path == null || path.trim().isEmpty()) {
            return "";
        }

        // 移除控制字符
        path = path.replaceAll("[\\x00-\\x1F\\x7F]", "");

        // 移除路径遍历字符
        path = path.replace("..", "");
        path = path.replace("~", "");

        // 移除其他危险字符
        String[] dangerousChars = {"\u003c", "\u003e", ":", "\"", "|", "?", "*"};
        for (String dangerous : dangerousChars) {
            path = path.replace(dangerous, "");
        }

        // 标准化路径分隔符
        path = path.replace("\\", "/");

        // 移除多余的斜杠
        path = path.replaceAll("/+", "/");

        return path.trim();
    }

    /**
     * 路径验证结果类
     */
    public static class PathValidationResult {
        private final boolean valid;
        private final String message;

        public PathValidationResult(boolean valid, String message) {
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

/**
 * 路径安全异常
 */
class PathSecurityException extends SecurityException {
    public PathSecurityException(String message) {
        super(message);
    }

    public PathSecurityException(String message, Throwable cause) {
        super(message, cause);
    }
}