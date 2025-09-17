package com.ryan.myblog.vo;

import lombok.Data;
import java.util.List;

/**
 * 博客详情增强视图对象
 */
@Data
public class BlogDetailEnhancedVO {
    
    /**
     * 博客详情
     */
    private BlogDetailVO blog;
    
    /**
     * 相关推荐博客
     */
    private List<BlogDetailVO> relatedBlogs;
    
    /**
     * 上一篇博客
     */
    private BlogDetailVO previousBlog;
    
    /**
     * 下一篇博客
     */
    private BlogDetailVO nextBlog;
    
    /**
     * 热门博客
     */
    private List<BlogDetailVO> hotBlogs;
    
    /**
     * 最新博客
     */
    private List<BlogDetailVO> latestBlogs;
    
    /**
     * 同分类推荐
     */
    private List<BlogDetailVO> categoryBlogs;
}