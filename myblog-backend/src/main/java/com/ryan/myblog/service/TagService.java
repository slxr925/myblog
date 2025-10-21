package com.ryan.myblog.service;

import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.model.vo.TagVO;

import java.util.List;

/**
 * 标签服务接口
 */
public interface TagService {
    
    /**
     * 查询所有标签
     */
    List<Tag> getAllTags();
    
    /**
     * 根据ID查询标签
     */
    Tag getTagById(Long id);
    
    /**
     * 保存标签
     */
    void saveTag(Tag tag);
    
    /**
     * 更新标签
     */
    void updateTag(Tag tag);
    
    /**
     * 删除标签
     */
    void deleteTag(Long id);
    
    /**
     * 根据博客ID查询标签列表
     */
    List<TagVO> getTagsByBlogId(Long blogId);
    
    /**
     * 批量保存标签（如果不存在则创建）
     */
    List<Tag> saveTagsIfNotExist(List<String> tagNames);

    /**
     * 获取所有被已发布博客使用的标签
     */
    List<Tag> getAllTagsUsedByBlogs();
}