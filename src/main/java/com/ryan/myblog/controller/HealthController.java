package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 健康检查控制器
 */
@RestController
@RequestMapping("/api")
public class HealthController {
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public Result<String> health() {
        return Result.success("MyBlog服务运行正常！");
    }
    
    /**
     * 首页欢迎信息
     */
    @GetMapping("/welcome")
    public Result<String> welcome() {
        return Result.success("欢迎使用MyBlog个人博客系统！");
    }
}