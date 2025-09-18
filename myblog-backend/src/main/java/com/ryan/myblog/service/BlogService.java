package com.ryan.myblog.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.BlogSaveDTO;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.vo.BlogDetailVO;

import java.util.List;

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
     * 支持管理员删除任意博客，普通用户只能删除自己的博客
     */
    void deleteBlog(Long id, Long operatorId);
    
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
    
    /**
     * 获取相关推荐博客
     */
    List<BlogDetailVO> getRelatedBlogs(Long blogId, int limit);
    
    /**
     * 获取上一篇博客
     */
    BlogDetailVO getPreviousBlog(Long blogId, Long categoryId);
    
    /**
     * 获取下一篇博客
     */
    BlogDetailVO getNextBlog(Long blogId, Long categoryId);
    
    /**
     * 获取热门博客
     */
    List<BlogDetailVO> getHotBlogs(int limit);
    
    /**
     * 获取最新博客
     */
    List<BlogDetailVO> getLatestBlogs(int limit);
    
    /**
     * 根据分类获取推荐博客
     */
    List<BlogDetailVO> getBlogsByCategory(Long categoryId, int limit);
    
    /**
     * 根据标签获取推荐博客
     */
    List<BlogDetailVO> getBlogsByTags(List<Long> tagIds, Long excludeBlogId, int limit);
}