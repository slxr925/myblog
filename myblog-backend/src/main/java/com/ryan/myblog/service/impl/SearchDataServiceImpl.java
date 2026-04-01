package com.ryan.myblog.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.ryan.myblog.mapper.BlogMapper;
import com.ryan.myblog.mapper.CategoryMapper;
import com.ryan.myblog.mapper.TagMapper;
import com.ryan.myblog.mapper.UserMapper;
import com.ryan.myblog.model.entity.Blog;
import com.ryan.myblog.model.entity.BlogDocument;
import com.ryan.myblog.model.entity.Category;
import com.ryan.myblog.model.entity.User;
import com.ryan.myblog.service.SearchDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 搜索数据服务实现
 */
@Slf4j
@Service
public class SearchDataServiceImpl implements SearchDataService {

    @Autowired
    private BlogMapper blogMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private CategoryMapper categoryMapper;

    @Autowired
    private TagMapper tagMapper;

    @Override
    public List<BlogDocument> getAllPublishedBlogDocuments() {
        // 查询所有已发布的博客
        List<Blog> blogs = blogMapper.selectList(
            new LambdaQueryWrapper<Blog>()
                .eq(Blog::getStatus, 1)  // 已发布
                .eq(Blog::getVisibility, 1)  // 公开可见
                .eq(Blog::getDeleted, 0)  // 未删除
                .orderByDesc(Blog::getPublishTime)
        );
        
        log.info("从数据库读取 {} 篇已发布博客", blogs.size());
        
        // 转换为 BlogDocument
        return blogs.stream()
            .map(this::convertToBlogDocument)
            .collect(Collectors.toList());
    }

    @Override
    public BlogDocument getBlogDocumentById(Long blogId) {
        Blog blog = blogMapper.selectById(blogId);
        if (blog == null) {
            return null;
        }
        return convertToBlogDocument(blog);
    }

    /**
     * 将 Blog 实体转换为 BlogDocument
     */
    private BlogDocument convertToBlogDocument(Blog blog) {
        BlogDocument doc = new BlogDocument();

        // 基本信息
        doc.setId(String.valueOf(blog.getId()));
        doc.setPublicId(blog.getPublicId());
        doc.setTitle(blog.getTitle());
        doc.setContent(blog.getContent());
        doc.setSummary(blog.getSummary());
        doc.setCoverImg(blog.getCoverImg());
        doc.setStatus(blog.getStatus());
        doc.setPublishTime(blog.getPublishTime());
        doc.setViewCount(blog.getViewCount() != null ? blog.getViewCount() : 0L);
        // 点赞数和评论数从 Redis 或其他服务获取，这里先设置为 0
        doc.setLikeCount(0L);
        doc.setCommentCount(0L);

        // 作者信息
        if (blog.getAuthorId() != null) {
            User author = userMapper.selectById(blog.getAuthorId());
            if (author != null) {
                doc.setAuthorName(author.getNickname());
            }
        }

        // 分类信息
        if (blog.getCategoryId() != null) {
            Category category = categoryMapper.selectById(blog.getCategoryId());
            if (category != null) {
                doc.setCategoryId(category.getId());
                doc.setCategoryName(category.getName());
            }
        }

        // 标签信息
        var tags = tagMapper.selectTagsByBlogId(blog.getId());
        if (tags != null && !tags.isEmpty()) {
            String[] tagNames = tags.stream()
                    .map(tag -> tag.getName())
                    .toArray(String[]::new);
            doc.setTags(tagNames);
        }

        return doc;
    }
}
