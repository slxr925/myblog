package com.ryan.myblog.service;

import com.ryan.myblog.model.entity.Category;

import java.util.List;

/**
 * 分类服务接口
 */
public interface CategoryService {
    
    /**
     * 查询所有分类
     */
    List<Category> getAllCategories();

    /**
     * 查询所有分类（带文章数量）
     */
    List<Category> getAllCategoriesWithCount();

    /**
     * 根据ID查询分类
     */
    Category getCategoryById(Long id);
    
    /**
     * 保存分类
     */
    void saveCategory(Category category);
    
    /**
     * 更新分类
     */
    void updateCategory(Category category);
    
    /**
     * 删除分类
     */
    void deleteCategory(Long id);
}