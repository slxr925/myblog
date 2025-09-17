package com.ryan.myblog.service;

/**
 * 缓存预热服务接口
 * 用于在应用启动时预热常用数据到缓存中
 */
public interface CacheWarmupService {
    
    /**
     * 预热所有缓存
     */
    void warmupAllCaches();
    
    /**
     * 预热分类缓存
     */
    void warmupCategoryCache();
    
    /**
     * 预热标签缓存
     */
    void warmupTagCache();
    
    /**
     * 预热热门博客缓存
     */
    void warmupHotBlogCache();
    
    /**
     * 预热最新博客缓存
     */
    void warmupLatestBlogCache();
    
    /**
     * 预热用户缓存
     */
    void warmupUserCache();
    
    /**
     * 检查预热是否完成
     * @return 预热是否完成
     */
    boolean isWarmupCompleted();
    
    /**
     * 获取预热进度
     * @return 预热进度字符串
     */
    String getWarmupProgress();
}