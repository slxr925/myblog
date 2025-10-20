package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 分类服务实现类
 */
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    
    private final CategoryMapper categoryMapper;
    private final CacheService cacheService;
    private final CacheConsistencyService cacheConsistencyService;
    
    private static final String CATEGORY_LIST_KEY = "category:list";
    private static final String CATEGORY_DETAIL_KEY_PREFIX = "category:detail:";
    private static final long CACHE_EXPIRE_SECONDS = 3600; // 1小时
    
    @Override
    @SuppressWarnings("unchecked")
    public List<Category> getAllCategories() {
        // 先从缓存中获取
        List<Category> categories = cacheService.get(CATEGORY_LIST_KEY, List.class);
        
        if (categories == null) {
            // 缓存中没有，从数据库查询
            LambdaQueryWrapper<Category> wrapper = new LambdaQueryWrapper<>();
            wrapper.orderByAsc(Category::getSort, Category::getCreateTime);
            categories = categoryMapper.selectList(wrapper);
            
            // 存入缓存
            cacheService.set(CATEGORY_LIST_KEY, categories, CACHE_EXPIRE_SECONDS);
        }
        
        return categories;
    }
    
    @Override
    public Category getCategoryById(Long id) {
        String cacheKey = CATEGORY_DETAIL_KEY_PREFIX + id;
        Category category = cacheService.get(cacheKey, Category.class);
        
        if (category == null) {
            category = categoryMapper.selectById(id);
            if (category != null) {
                cacheService.set(cacheKey, category, CACHE_EXPIRE_SECONDS);
            }
        }
        
        return category;
    }
    
    @Override
    @Transactional
    public void saveCategory(Category category) {
        category.setCreateTime(LocalDateTime.now());
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.insert(category);

        // 清除分类列表缓存
        clearCategoryListCache();

        // 发布缓存失效通知
        cacheConsistencyService.publishCacheInvalidation("category:*", "分类新增");
    }

    @Override
    @Transactional
    public void updateCategory(Category category) {
        category.setUpdateTime(LocalDateTime.now());
        categoryMapper.updateById(category);

        // 清除相关缓存
        clearCategoryCache(category.getId());
        clearCategoryListCache();

        // 更新缓存版本
        cacheConsistencyService.updateCacheVersion("category:*");
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        categoryMapper.deleteById(id);

        // 清除相关缓存
        clearCategoryCache(id);
        clearCategoryListCache();

        // 发布缓存失效通知
        cacheConsistencyService.publishCacheInvalidation("category:*", "分类删除");
    }
    
    /**
     * 清除单个分类缓存
     */
    private void clearCategoryCache(Long categoryId) {
        cacheService.delete(CATEGORY_DETAIL_KEY_PREFIX + categoryId);
    }
    
    /**
     * 清除分类列表缓存
     */
    private void clearCategoryListCache() {
        cacheService.delete(CATEGORY_LIST_KEY);
    }
}