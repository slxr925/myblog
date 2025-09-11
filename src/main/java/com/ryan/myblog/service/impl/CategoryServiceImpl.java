package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.entity.Category;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 分类服务实现类
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    
    private final CategoryMapper categoryMapper;
    
    @Override
    public List<Category> getAllCategories() {
        LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(Category::getSort, Category::getCreateTime);
        return categoryMapper.selectList(wrapper);
    }
    
    @Override
    public Category getCategoryById(Long id) {
        return categoryMapper.selectById(id);
    }
    
    @Override
    public void saveCategory(Category category) {
        category.setCreateTime(LocalDateTime.now());
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.insert(category);
    }
    
    @Override
    public void updateCategory(Category category) {
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.updateById(category);
    }
    
    @Override
    public void deleteCategory(Long id) {
        categoryMapper.deleteById(id);
    }
}