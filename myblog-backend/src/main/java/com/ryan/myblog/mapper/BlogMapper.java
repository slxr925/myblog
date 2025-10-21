package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.vo.BlogDetailVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 博客Mapper接口
 */
@Mapper
public interface BlogMapper extends BaseMapper<Blog> {
    
    /**
     * 分页查询博客列表（包含作者和分类信息）
     */
    IPage<BlogDetailVO> selectBlogPage(Page<BlogDetailVO> page, 
                                      @Param("categoryId") Long categoryId,
                                      @Param("tagId") Long tagId,
                                      @Param("keyword") String keyword,
                                      @Param("status") Integer status);
    
    /**
     * 查询博客详情（包含作者、分类、标签信息）
     */
    BlogDetailVO selectBlogDetail(@Param("id") Long id);
    
    /**
     * 增加阅读量
     */
    void incrementViewCount(@Param("id") Long id);
    
    /**
     * 增加点赞数
     */
    void incrementLikeCount(@Param("id") Long id);
    
    /**
     * 减少点赞数
     */
    void decrementLikeCount(@Param("id") Long id);
    
    /**
     * 查询相关推荐博客（根据分类和标签）
     */
    List<BlogDetailVO> selectRelatedBlogs(@Param("blogId") Long blogId,
                                         @Param("categoryId") Long categoryId,
                                         @Param("tagIds") List<Long> tagIds,
                                         @Param("limit") int limit);
    
    /**
     * 查询上一篇博客
     */
    BlogDetailVO selectPreviousBlog(@Param("blogId") Long blogId,
                                   @Param("categoryId") Long categoryId);
    
    /**
     * 查询下一篇博客
     */
    BlogDetailVO selectNextBlog(@Param("blogId") Long blogId,
                               @Param("categoryId") Long categoryId);
    
    /**
     * 查询热门博客（按阅读量排序）
     */
    List<BlogDetailVO> selectHotBlogs(@Param("limit") int limit);
    
    /**
     * 查询最新博客（按发布时间排序）
     */
    List<BlogDetailVO> selectLatestBlogs(@Param("limit") int limit);
    
    /**
     * 根据分类查询博客
     */
    List<BlogDetailVO> selectBlogsByCategory(@Param("categoryId") Long categoryId,
                                           @Param("limit") int limit);
    
    /**
     * 根据标签查询博客
     */
    List<BlogDetailVO> selectBlogsByTags(@Param("tagIds") List<Long> tagIds,
                                       @Param("excludeBlogId") Long excludeBlogId,
                                       @Param("limit") int limit);
}