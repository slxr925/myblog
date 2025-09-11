package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.BlogSaveDTO;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.vo.BlogDetailVO;

/**
 * 博客服务接口
 */
public interface BlogService {
    
    /**
     * 保存博客
     */
    void saveBlog(BlogSaveDTO blogSaveDTO, Long authorId);
    
    /**
     * 更新博客
     */
    void updateBlog(Long id, BlogSaveDTO blogSaveDTO, Long authorId);
    
    /**
     * 删除博客
     */
    void deleteBlog(Long id, Long authorId);
    
    /**
     * 分页查询博客列表
     */
    IPage<BlogDetailVO> getBlogPage(PageRequest pageRequest, Long categoryId, 
                                   Long tagId, String keyword, Integer status);
    
    /**
     * 查询博客详情
     */
    BlogDetailVO getBlogDetail(Long id);
    
    /**
     * 增加阅读量
     */
    void incrementViewCount(Long id);
    
    /**
     * 点赞/取消点赞
     */
    void toggleLike(Long id, Long userId);
    
    /**
     * 发布博客
     */
    void publishBlog(Long id, Long authorId);
    
    /**
     * 下线博客
     */
    void unpublishBlog(Long id, Long authorId);
}