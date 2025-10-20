package com.ryan.myblog.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.model.vo.TagVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 标签Mapper接口
 */
@Mapper
public interface TagMapper extends BaseMapper<Tag> {
    
    /**
     * 根据博客ID查询标签列表
     */
    List<TagVO> selectTagsByBlogId(@Param("blogId") Long blogId);
}