package com.ryan.myblog.service.impl;

import com.ryan.myblog.config.FileUploadProperties;
import com.ryan.myblog.service.FileUploadService;
import com.ryan.myblog.utils.PathSecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 安全文件上传服务实现
 *
 * 安全特性：
 * 1. 多重文件类型验证（MIME类型、文件头、扩展名）
 * 2. 路径遍历攻击防护
 * 3. 文件大小限制
 * 4. 文件名安全处理
 * 5. 恶意文件检测
 * 6. 上传目录隔离
 */
@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class SecureFileUploadServiceImpl implements FileUploadService {

    private final FileUploadProperties fileUploadProperties;

    // 常见图片文件头
    private static final Map<String, byte[]> IMAGE_FILE_HEADERS = new HashMap<>();
    // 常见文档文件头
    private static final Map<String, byte[]> DOCUMENT_FILE_HEADERS = new HashMap<>();

    static {
        // 图片文件头
        IMAGE_FILE_HEADERS.put("image/jpeg", new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
        IMAGE_FILE_HEADERS.put("image/png", new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
        IMAGE_FILE_HEADERS.put("image/gif", new byte[]{0x47, 0x49, 0x46});
        IMAGE_FILE_HEADERS.put("image/webp", new byte[]{0x52, 0x49, 0x46, 0x46});
        IMAGE_FILE_HEADERS.put("image/bmp", new byte[]{0x42, 0x4D});
        IMAGE_FILE_HEADERS.put("image/svg+xml", new byte[]{0x3C}); // <

        // 文档文件头（如果需要支持）
        DOCUMENT_FILE_HEADERS.put("application/pdf", new byte[]{0x25, 0x50, 0x44, 0x46}); // %PDF
    }

    @Override
    public String uploadImage(MultipartFile file, String type) {
        // 安全验证
        validateFileUpload(file, fileUploadProperties.getAllowedImageTypes(),
                          fileUploadProperties.getMaxImageSize(), "image");

        return uploadFileSecure(file, type != null ? type : "image");
    }

    @Override
    public String uploadFile(MultipartFile file, String type) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        // 对通用文件上传进行更严格的验证
        validateFileUpload(file, fileUploadProperties.getAllowedFileTypes(),
                          fileUploadProperties.getMaxFileSize(), "file");

        return uploadFileSecure(file, type != null ? type : "file");
    }

    @Override
    public boolean deleteFile(String filePath) {
        try {
            // 安全路径验证
            String safePath = validateAndSanitizePath(filePath);
            if (safePath == null) {
                log.error("文件路径验证失败: {}", filePath);
                return false;
            }

            Path path = Paths.get(safePath);

            if (Files.exists(path)) {
                // 验证文件是否在允许的目录内
                if (!isPathInAllowedDirectory(path)) {
                    log.error("尝试删除不允许目录的文件: {}", filePath);
                    return false;
                }

                Files.delete(path);
                log.info("文件删除成功: {}", filePath);
                return true;
            } else {
                log.warn("文件不存在: {}", filePath);
                return false;
            }
        } catch (IOException e) {
            log.error("文件删除失败: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public boolean isValidFileType(MultipartFile file, String[] allowedTypes) {
        return validateFileType(file, allowedTypes);
    }

    @Override
    public boolean isValidFileSize(MultipartFile file, long maxSizeMB) {
        return validateFileSize(file, maxSizeMB);
    }

    /**
     * 安全的文件上传
     */
    private String uploadFileSecure(MultipartFile file, String type) {
        try {
            // 创建安全的上传路径
            String safeUploadPath = createSecureUploadPath(type);

            // 生成安全的文件名
            String safeFileName = generateSecureFileName(file.getOriginalFilename());

            // 完整文件路径
            Path filePath = Paths.get(safeUploadPath, safeFileName);

            // 确保目录存在
            Files.createDirectories(filePath.getParent());

            // 保存文件
            file.transferTo(filePath);

            // 验证上传的文件
            validateUploadedFile(filePath, file.getContentType());

            // 返回访问URL
            String relativeUrl = generateSecureAccessUrl(type, safeFileName);

            log.info("文件安全上传成功: {} -> {}", file.getOriginalFilename(), relativeUrl);

            return relativeUrl;

        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage(), e);
            throw new RuntimeException("文件上传失败", e);
        }
    }

    /**
     * 文件上传安全验证
     */
    private void validateFileUpload(MultipartFile file, String[] allowedTypes, long maxSizeMB, String uploadType) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("文件不能为空");
        }

        // 验证文件大小
        if (!validateFileSize(file, maxSizeMB)) {
            throw new IllegalArgumentException(String.format("文件大小超过限制：最大 %dMB", maxSizeMB));
        }

        // 验证文件类型（多重验证）
        if (!validateFileType(file, allowedTypes)) {
            throw new IllegalArgumentException("不支持的文件类型");
        }

        // 验证文件头
        if (!validateFileHeader(file)) {
            throw new IllegalArgumentException("文件头验证失败，可能为伪造文件");
        }

        // 验证文件名
        if (!validateFileName(file.getOriginalFilename())) {
            throw new IllegalArgumentException("文件名包含非法字符");
        }

        // 检测恶意内容
        if (detectMaliciousContent(file)) {
            throw new IllegalArgumentException("文件可能包含恶意内容");
        }

        log.info("文件上传验证通过: {} ({}), 大小: {}KB, 类型: {}",
                 file.getOriginalFilename(), uploadType,
                 file.getSize() / 1024, file.getContentType());
    }

    /**
     * 验证文件类型（多重验证）
     */
    private boolean validateFileType(MultipartFile file, String[] allowedTypes) {
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();

        if (contentType == null || originalFilename == null) {
            return false;
        }

        // 1. MIME类型验证
        boolean mimeTypeValid = Arrays.asList(allowedTypes).contains(contentType);

        // 2. 文件扩展名验证
        boolean extensionValid = validateFileExtension(originalFilename, allowedTypes);

        // 3. 文件头验证（在上传后验证）

        return mimeTypeValid && extensionValid;
    }

    /**
     * 验证文件扩展名
     */
    private boolean validateFileExtension(String filename, String[] allowedTypes) {
        String extension = getFileExtension(filename).toLowerCase();

        Map<String, String> extensionMapping = new HashMap<>();
        extensionMapping.put(".jpg", "image/jpeg");
        extensionMapping.put(".jpeg", "image/jpeg");
        extensionMapping.put(".png", "image/png");
        extensionMapping.put(".gif", "image/gif");
        extensionMapping.put(".webp", "image/webp");
        extensionMapping.put(".bmp", "image/bmp");
        extensionMapping.put(".svg", "image/svg+xml");
        extensionMapping.put(".pdf", "application/pdf");
        extensionMapping.put(".txt", "text/plain");
        extensionMapping.put(".md", "text/markdown");

        String expectedMimeType = extensionMapping.get(extension);
        return expectedMimeType != null && Arrays.asList(allowedTypes).contains(expectedMimeType);
    }

    /**
     * 验证文件头
     */
    private boolean validateFileHeader(MultipartFile file) {
        try {
            byte[] fileHeader = file.getBytes();
            if (fileHeader.length < 8) {
                return false;
            }

            String contentType = file.getContentType();

            // 检查图片文件头
            if (IMAGE_FILE_HEADERS.containsKey(contentType)) {
                byte[] expectedHeader = IMAGE_FILE_HEADERS.get(contentType);
                return Arrays.equals(Arrays.copyOf(fileHeader, expectedHeader.length), expectedHeader);
            }

            return true;
        } catch (IOException e) {
            log.error("文件头验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 验证上传后的文件
     */
    private void validateUploadedFile(Path filePath, String expectedContentType) {
        try {
            byte[] fileContent = Files.readAllBytes(filePath);

            // 重新验证文件头
            if (fileContent.length >= 8) {
                if (IMAGE_FILE_HEADERS.containsKey(expectedContentType)) {
                    byte[] expectedHeader = IMAGE_FILE_HEADERS.get(expectedContentType);
                    byte[] actualHeader = Arrays.copyOf(fileContent, expectedHeader.length);

                    if (!Arrays.equals(actualHeader, expectedHeader)) {
                        Files.delete(filePath);
                        throw new IllegalArgumentException("文件头与声明的MIME类型不匹配");
                    }
                }
            }

            // 验证文件大小一致性
            long actualSize = Files.size(filePath);
            if (actualSize == 0) {
                Files.delete(filePath);
                throw new IllegalArgumentException("上传文件为空");
            }

            log.info("上传文件验证完成: {}, 大小: {}KB, 类型: {}",
                     filePath.getFileName(), actualSize / 1024, expectedContentType);

        } catch (IOException e) {
            try {
                Files.deleteIfExists(filePath);
            } catch (IOException ex) {
                log.error("删除验证失败的文件时出错: {}", ex.getMessage());
            }
            throw new RuntimeException("文件验证失败", e);
        }
    }

    /**
     * 验证文件大小
     */
    private boolean validateFileSize(MultipartFile file, long maxSizeMB) {
        long maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.getSize() > 0 && file.getSize() <= maxSizeBytes;
    }

    /**
     * 验证文件名
     */
    private boolean validateFileName(String filename) {
        if (filename == null || filename.isEmpty()) {
            return false;
        }

        // 检查非法字符
        String invalidChars = "[<>:\"|?*\\x00-\\x1F]";
        if (filename.matches(".*" + invalidChars + ".*")) {
            return false;
        }

        // 检查路径遍历字符
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return false;
        }

        // 长度限制
        return filename.length() <= 255;
    }

    /**
     * 路径安全验证
     */
    private String validateAndSanitizePath(String path) {
        if (path == null || path.isEmpty()) {
            return null;
        }

        try {
            // 防止路径遍历攻击
            if (path.contains("..") || path.contains("~")) {
                return null;
            }

            // 标准化路径
            Path normalizedPath = Paths.get(path).normalize();

            // 验证路径是否在允许的目录内
            if (!isPathInAllowedDirectory(normalizedPath)) {
                return null;
            }

            return normalizedPath.toString();
        } catch (Exception e) {
            log.error("路径验证失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 检查路径是否在允许的目录内
     */
    private boolean isPathInAllowedDirectory(Path path) {
        try {
            Path uploadDir = Paths.get(fileUploadProperties.getPath()).toAbsolutePath().normalize();
            Path targetPath = path.toAbsolutePath().normalize();

            // 确保目标路径在upload目录内
            return targetPath.startsWith(uploadDir);
        } catch (Exception e) {
            log.error("路径检查失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 检测恶意内容
     */
    private boolean detectMaliciousContent(MultipartFile file) {
        try {
            String contentType = file.getContentType();

            // 禁止可执行文件
            if (contentType != null && (
                contentType.contains("executable") ||
                contentType.contains("script") ||
                contentType.contains("java") ||
                contentType.contains("php") ||
                contentType.contains("asp")
            )) {
                return true;
            }

            // 检查文件扩展名
            String filename = file.getOriginalFilename();
            if (filename != null) {
                String extension = getFileExtension(filename).toLowerCase();
                String[] dangerousExtensions = {".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js", ".jar", ".php", ".asp", ".sh"};

                for (String dangerous : dangerousExtensions) {
                    if (extension.equals(dangerous)) {
                        return true;
                    }
                }
            }

            return false;
        } catch (Exception e) {
            log.error("恶意内容检测失败: {}", e.getMessage());
            return true; // 出错时默认拒绝
        }
    }

    /**
     * 创建安全的上传路径
     */
    private String createSecureUploadPath(String type) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

        // 确保type是安全的（只包含字母数字和下划线）
        if (type != null && !type.matches("[a-zA-Z0-9_]+")) {
            type = "unknown";
        }

        return Paths.get(fileUploadProperties.getPath(), type, datePath).toString();
    }

    /**
     * 生成安全的文件名
     */
    private String generateSecureFileName(String originalFilename) {
        String extension = getFileExtension(originalFilename);
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String timestamp = String.valueOf(System.currentTimeMillis());

        // 确保扩展名是安全的
        if (!extension.matches("\\.[a-zA-Z0-9]+")) {
            extension = ".dat";
        }

        return uuid + "_" + timestamp + extension.toLowerCase();
    }

    /**
     * 生成安全的访问URL
     */
    private String generateSecureAccessUrl(String type, String fileName) {
        String datePath = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));

        // URL编码处理
        String encodedFileName = fileName.replace(" ", "%20");

        return fileUploadProperties.getUrlPrefix() + "/" + type + "/" + datePath + "/" + encodedFileName;
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}