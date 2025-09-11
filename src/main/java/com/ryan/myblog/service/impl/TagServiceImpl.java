package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.entity.Tag;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.vo.TagVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * 标签服务实现类
 */
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {
    
    private final TagMapper tagMapper;
    
    @Override
    public List<Tag> getAllTags() {
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Tag::getCreateTime);
        return tagMapper.selectList(wrapper);
    }
    
    @Override
    public Tag getTagById(Long id) {
        return tagMapper.selectById(id);
    }
    
    @Override
    public void saveTag(Tag tag) {
        // 检查标签名是否已存在
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Tag::getName, tag.getName());
        Tag existTag = tagMapper.selectOne(wrapper);
        if (existTag != null) {
            throw new RuntimeException("标签名称已存在");
        }
        
        tag.setCreateTime(LocalDateTime.now());
        tag.setUpdateTime(LocalDateTime.now());
        tagMapper.insert(tag);
    }
    
    @Override
    public void updateTag(Tag tag) {
        // 检查标签名是否已存在（排除自己）
        LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Tag::getName, tag.getName());
        wrapper.ne(Tag::getId, tag.getId());
        Tag existTag = tagMapper.selectOne(wrapper);
        if (existTag != null) {
            throw new RuntimeException("标签名称已存在");
        }
        
        tag.setUpdateTime(LocalDateTime.now());
        tagMapper.updateById(tag);
    }
    
    @Override
    public void deleteTag(Long id) {
        tagMapper.deleteById(id);
    }
    
    @Override
    public List<TagVO> getTagsByBlogId(Long blogId) {
        return tagMapper.selectTagsByBlogId(blogId);
    }
    
    @Override
    public List<Tag> saveTagsIfNotExist(List<String> tagNames) {
        List<Tag> tags = new ArrayList<>();
        
        if (tagNames == null || tagNames.isEmpty()) {
            return tags;
        }
        
        // 生成默认颜色列表
        String[] colors = {"#f56a00", "#722ed1", "#1890ff", "#eb2f96", "#52c41a", 
                          "#13c2c2", "#faad14", "#fa541c", "#2f54eb", "#389e0d"};
        
        for (String tagName : tagNames) {
            if (!StringUtils.hasText(tagName)) {
                continue;
            }
            
            // 查询标签是否已存在
            LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(Tag::getName, tagName.trim());
            Tag existTag = tagMapper.selectOne(wrapper);
            
            if (existTag != null) {
                tags.add(existTag);
            } else {
                // 创建新标签
                Tag newTag = new Tag();
                newTag.setName(tagName.trim());
                newTag.setColor(colors[tags.size() % colors.length]); // 循环使用颜色
                newTag.setCreateTime(LocalDateTime.now());
                newTag.setUpdateTime(LocalDateTime.now());
                
                tagMapper.insert(newTag);
                tags.add(newTag);
            }
        }
        
        return tags;
    }
}