package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.ryan.myblog.common.PageRequest;
import com.ryan.myblog.dto.BlogSaveDTO;
import com.ryan.myblog.entity.Blog;
import com.ryan.myblog.entity.BlogTag;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.BlogTagMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.service.BlogService;
import com.ryan.myblog.vo.BlogDetailVO;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 博客服务实现类（简化版）
 */
@Service
@RequiredArgsConstructor
public class BlogServiceImpl implements BlogService {
    
    private final BlogMapper blogMapper;
    private final BlogTagMapper blogTagMapper;
    private final TagMapper tagMapper;
    
    @Override
    @Transactional
    public void saveBlog(BlogSaveDTO blogSaveDTO, Long authorId) {
        // 创建博客实体
        Blog blog = new Blog();
        blog.setTitle(blogSaveDTO.getTitle());
        blog.setSummary(blogSaveDTO.getSummary());
        blog.setContent(blogSaveDTO.getContent());
        blog.setCoverImg(blogSaveDTO.getCoverImg());
        blog.setAuthorId(authorId);
        blog.setCategoryId(blogSaveDTO.getCategoryId());
        blog.setStatus(blogSaveDTO.getStatus());
        blog.setIsTop(blogSaveDTO.getIsTop());
        blog.setViewCount(0);
        blog.setLikeCount(0);
        blog.setCommentCount(0);
        
        if (blogSaveDTO.getStatus() == 1) { // 已发布
            blog.setPublishTime(LocalDateTime.now());
        }
        
        // 保存博客
        blogMapper.insert(blog);
        
        // 保存标签关联
        if (blogSaveDTO.getTagIds() != null && !blogSaveDTO.getTagIds().isEmpty()) {
            saveBlogTags(blog.getId(), blogSaveDTO.getTagIds());
        }
    }
    
    @Override
    @Transactional
    public void updateBlog(Long id, BlogSaveDTO blogSaveDTO, Long authorId) {
        // 检查博客是否存在且属于当前用户
        Blog existBlog = blogMapper.selectById(id);
        if (existBlog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!existBlog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限修改此博客");
        }
        
        // 更新博客信息
        existBlog.setTitle(blogSaveDTO.getTitle());
        existBlog.setSummary(blogSaveDTO.getSummary());
        existBlog.setContent(blogSaveDTO.getContent());
        existBlog.setCoverImg(blogSaveDTO.getCoverImg());
        existBlog.setCategoryId(blogSaveDTO.getCategoryId());
        existBlog.setStatus(blogSaveDTO.getStatus());
        existBlog.setIsTop(blogSaveDTO.getIsTop());
        
        if (blogSaveDTO.getStatus() == 1 && existBlog.getPublishTime() == null) {
            existBlog.setPublishTime(LocalDateTime.now());
        }
        
        blogMapper.updateById(existBlog);
        
        // 更新标签关联
        blogTagMapper.deleteByBlogId(id);
        if (blogSaveDTO.getTagIds() != null && !blogSaveDTO.getTagIds().isEmpty()) {
            saveBlogTags(id, blogSaveDTO.getTagIds());
        }
    }
    
    @Override
    public void deleteBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!blog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限删除此博客");
        }
        
        blogMapper.deleteById(id);
        blogTagMapper.deleteByBlogId(id);
    }
    
    @Override
    public IPage<BlogDetailVO> getBlogPage(PageRequest pageRequest, Long categoryId, 
                                          Long tagId, String keyword, Integer status) {
        Page<BlogDetailVO> page = new Page<>(pageRequest.getPage(), pageRequest.getSize());
        
        IPage<BlogDetailVO> result = blogMapper.selectBlogPage(page, categoryId, tagId, keyword, status);
        
        // 为每个博客设置标签信息
        result.getRecords().forEach(blog -> {
            blog.setTags(tagMapper.selectTagsByBlogId(blog.getId()));
        });
        
        return result;
    }
    
    @Override
    public BlogDetailVO getBlogDetail(Long id) {
        BlogDetailVO blog = blogMapper.selectBlogDetail(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        
        // 设置标签信息
        blog.setTags(tagMapper.selectTagsByBlogId(id));
        
        return blog;
    }
    
    @Override
    public void incrementViewCount(Long id) {
        // 简化版本，直接增加阅读量
        blogMapper.incrementViewCount(id);
    }
    
    @Override
    public void toggleLike(Long id, Long userId) {
        // 简化版本，直接增加点赞数
        blogMapper.incrementLikeCount(id);
    }
    
    @Override
    public void publishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!blog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限发布此博客");
        }
        
        blog.setStatus(1);
        blog.setPublishTime(LocalDateTime.now());
        blogMapper.updateById(blog);
    }
    
    @Override
    public void unpublishBlog(Long id, Long authorId) {
        Blog blog = blogMapper.selectById(id);
        if (blog == null) {
            throw new RuntimeException("博客不存在");
        }
        if (!blog.getAuthorId().equals(authorId)) {
            throw new RuntimeException("无权限下线此博客");
        }
        
        blog.setStatus(2);
        blogMapper.updateById(blog);
    }
    
    /**
     * 保存博客标签关联
     */
    private void saveBlogTags(Long blogId, List<Long> tagIds) {
        List<BlogTag> blogTags = tagIds.stream()
                .map(tagId -> {
                    BlogTag blogTag = new BlogTag();
                    blogTag.setBlogId(blogId);
                    blogTag.setTagId(tagId);
                    blogTag.setCreateTime(LocalDateTime.now());
                    return blogTag;
                })
                .collect(Collectors.toList());
        
        blogTagMapper.insertBatch(blogTags);
    }
}