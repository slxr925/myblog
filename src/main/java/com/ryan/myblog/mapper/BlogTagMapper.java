package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.entity.BlogTag;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 博客标签关联Mapper接口
 */
@Mapper
public interface BlogTagMapper extends BaseMapper<BlogTag> {
    
    /**
     * 批量插入博客标签关联
     */
    void insertBatch(@Param("list") List<BlogTag> blogTags);
    
    /**
     * 根据博客ID删除关联标签
     */
    void deleteByBlogId(@Param("blogId") Long blogId);
}