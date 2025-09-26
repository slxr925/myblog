package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传控制器
 */
@Slf4j
@RestController
@RequestMapping("/api/upload")
@RequiredArgsConstructor
public class FileUploadController {
    
    private final FileUploadService fileUploadService;
    
    @PostMapping("/image")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "content") String type) {
        
        try {
            String url = fileUploadService.uploadImage(file, type);
            
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            result.put("filename", file.getOriginalFilename());
            result.put("type", type);
            
            return Result.success(result);
            
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            log.error("图片上传失败", e);
            return Result.error("图片上传失败");
        }
    }
    
    @PostMapping("/file")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "type", defaultValue = "document") String type) {
        
        try {
            String url = fileUploadService.uploadFile(file, type);
            
            Map<String, String> result = new HashMap<>();
            result.put("url", url);
            result.put("filename", file.getOriginalFilename());
            result.put("type", type);
            result.put("size", String.valueOf(file.getSize()));
            
            return Result.success(result);
            
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            log.error("文件上传失败", e);
            return Result.error("文件上传失败");
        }
    }
    
    @PostMapping("/editor/image")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Object>> uploadEditorImage(
            @RequestParam("file") MultipartFile file) {
        
        try {
            String url = fileUploadService.uploadImage(file, "editor");
            
            // 适配常见富文本编辑器的返回格式
            Map<String, Object> result = new HashMap<>();
            result.put("errno", 0); // wangEditor格式
            result.put("data", Map.of("url", url)); // wangEditor格式
            result.put("url", url); // 通用格式
            result.put("filename", file.getOriginalFilename());
            
            return Result.success(result);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("errno", 1);
            errorResult.put("message", e.getMessage());
            return Result.success(errorResult); // 富文本编辑器需要200状态码
        } catch (Exception e) {
            log.error("编辑器图片上传失败", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("errno", 1);
            errorResult.put("message", "图片上传失败");
            return Result.success(errorResult);
        }
    }
    
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteFile(
            @RequestParam("url") String url) {
        
        try {
            boolean deleted = fileUploadService.deleteFile(url);
            if (deleted) {
                return Result.success();
            } else {
                return Result.error("文件删除失败");
            }
        } catch (Exception e) {
            log.error("文件删除失败", e);
            return Result.error("文件删除失败");
        }
    }
}