package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.service.CacheService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 缓存测试控制器
 */
@Tag(name = "缓存测试", description = "Redis缓存功能测试接口")
@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheTestController {
    
    private final CacheService cacheService;
    
    @Operation(summary = "设置缓存")
    @PostMapping("/set")
    public Result<Void> setCache(@RequestParam String key, @RequestParam String value) {
        cacheService.set(key, value, 300); // 5分钟过期
        return Result.success();
    }
    
    @Operation(summary = "获取缓存")
    @GetMapping("/get")
    public Result<String> getCache(@RequestParam String key) {
        String value = cacheService.get(key, String.class);
        return Result.success(value);
    }
    
    @Operation(summary = "删除缓存")
    @DeleteMapping("/delete")
    public Result<Void> deleteCache(@RequestParam String key) {
        cacheService.delete(key);
        return Result.success();
    }
    
    @Operation(summary = "检查缓存是否存在")
    @GetMapping("/exists")
    public Result<Boolean> existsCache(@RequestParam String key) {
        boolean exists = cacheService.exists(key);
        return Result.success(exists);
    }
}