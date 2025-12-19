package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.model.entity.Tag;
import com.ryan.myblog.model.entity.BlogTag;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.mapper.BlogTagMapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.service.CacheService;
import com.ryan.myblog.service.CacheConsistencyService;
import com.ryan.myblog.service.TagService;
import com.ryan.myblog.model.vo.TagVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 标签服务实现类
 */
@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;
    private final BlogTagMapper blogTagMapper;
    private final BlogMapper blogMapper;
    private final CacheService cacheService;
    private final CacheConsistencyService cacheConsistencyService;

    private static final String TAG_LIST_KEY = "tag:list";
    private static final long CACHE_EXPIRE_SECONDS = 3600; // 1小时

    @Override
    public List<Tag> getAllTags() {
        // 先从缓存中获取，使用getList正确处理泛型列表的反序列化
        List<Tag> tags = cacheService.getList(TAG_LIST_KEY, Tag.class);

        if (tags == null) {
            // 缓存中没有，从数据库查询
            LambdaQueryWrapper<Tag> wrapper = new LambdaQueryWrapper<>();
            wrapper.orderByDesc(Tag::getCreateTime);
            tags = tagMapper.selectList(wrapper);

            // 存入缓存
            cacheService.set(TAG_LIST_KEY, tags, CACHE_EXPIRE_SECONDS);
        }

        return tags;
    }

    @Override
    public Tag getTagById(Long id) {
        return tagMapper.selectById(id);
    }

    @Override
    @Transactional
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

        cacheService.delete(TAG_LIST_KEY);
        cacheConsistencyService.updateCacheVersion("tag:*");
    }

    @Override
    @Transactional
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

        cacheService.delete(TAG_LIST_KEY);
        cacheConsistencyService.updateCacheVersion("tag:*");
    }

    @Override
    @Transactional
    public void deleteTag(Long id) {
        tagMapper.deleteById(id);

        cacheService.delete(TAG_LIST_KEY);
        cacheConsistencyService.updateCacheVersion("tag:*");
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
        String[] colors = { "#f56a00", "#722ed1", "#1890ff", "#eb2f96", "#52c41a",
                "#13c2c2", "#faad14", "#fa541c", "#2f54eb", "#389e0d" };

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

        // 如果有新增标签，发布缓存失效通知
        if (!tags.isEmpty()) {
            cacheService.delete(TAG_LIST_KEY);
            cacheConsistencyService.updateCacheVersion("tag:*");
        }

        return tags;
    }

    @Override
    public List<Tag> getAllTagsUsedByBlogs() {
        // 查询所有被已发布博客使用的标签
        LambdaQueryWrapper<BlogTag> blogTagQuery = new LambdaQueryWrapper<>();
        List<BlogTag> blogTags = blogTagMapper.selectList(blogTagQuery);

        if (blogTags.isEmpty()) {
            return new ArrayList<>();
        }

        // 查询这些标签对应的博客，确保博客是已发布状态
        List<Long> blogIds = blogTags.stream()
                .map(BlogTag::getBlogId)
                .distinct()
                .collect(Collectors.toList());

        List<Long> publishedBlogIds = blogMapper.selectPublishedBlogIds(blogIds);
        if (publishedBlogIds.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取已发布博客的标签关联
        List<Long> usedTagIds = blogTagMapper.selectList(
                new LambdaQueryWrapper<BlogTag>().in(BlogTag::getBlogId, publishedBlogIds)).stream()
                .map(BlogTag::getTagId).distinct().collect(Collectors.toList());

        // 查询标签信息
        if (!usedTagIds.isEmpty()) {
            LambdaQueryWrapper<Tag> tagQuery = new LambdaQueryWrapper<Tag>()
                    .in(Tag::getId, usedTagIds);
            return tagMapper.selectList(tagQuery);
        }

        return new ArrayList<>();
    }
}