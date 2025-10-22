package com.ryan.myblog.controller;

import com.ryan.myblog.common.Result;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 分类控制器
 */
@RestController
@RequestMapping("/api/category")
@RequiredArgsConstructor
public class CategoryController {
    
    private final CategoryService categoryService;
    
    /**
     * 获取所有分类（带文章数量）
     */
    @GetMapping("/list")
    public Result<List<Category>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategoriesWithCount();
        return Result.success(categories);
    }
    
    /**
     * 根据ID查询分类
     */
    @GetMapping("/{id}")
    public Result<Category> getCategoryById(@PathVariable Long id) {
        Category category = categoryService.getCategoryById(id);
        return Result.success(category);
    }
    
    /**
     * 保存分类
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> saveCategory(@RequestBody Category category) {
        categoryService.saveCategory(category);
        return Result.success();
    }
    
    /**
     * 更新分类
     */
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateCategory(@RequestBody Category category) {
        categoryService.updateCategory(category);
        return Result.success();
    }
    
    /**
     * 删除分类
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return Result.success();
    }
}