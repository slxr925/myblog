package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.vo.BlogDetailVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

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
}